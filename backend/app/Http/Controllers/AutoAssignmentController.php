<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\FilteredCustomer;
use App\Models\Caller;
use App\Models\Admin;
use App\Models\Request as TaskRequest;
use Illuminate\Support\Facades\DB;

class AutoAssignmentController extends Controller
{
    /**
     * Automatically assign customers to callers based on their available capacity
     */
    public function autoAssign(Request $request)
    {
        try {
            $user = $request->attributes->get('user');
            $tokenData = $request->attributes->get('token_data');
            
            // Only admins and supervisors can auto-assign
            if ($tokenData->userType !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Only admins can auto-assign customers.'
                ], 403);
            }
            
            // Get optional caller IDs from request
            $requestedCallerIds = $request->input('caller_ids', []);
            
            DB::beginTransaction();
            
            // Get admin to check role and permissions
            $admin = Admin::find($user->id);
            
            // Get callers based on admin's permissions
            $callersQuery = Caller::where('status', 'active')
                ->whereRaw('currentLoad < maxLoad');
            
            // If specific callers requested, filter to those
            if (!empty($requestedCallerIds)) {
                $callersQuery->whereIn('id', $requestedCallerIds);
            }
            
            // Apply region/RTOM filtering based on admin role
            if ($admin->role === 'supervisor' && $admin->rtom) {
                $callersQuery->where('rtom', $admin->rtom);
            } elseif ($admin->role === 'rtom_admin' && $admin->rtom) {
                $callersQuery->where('rtom', $admin->rtom);
            } elseif ($admin->role === 'region_admin' && $admin->region) {
                $callersQuery->where('region', $admin->region);
            }
            // Superadmin gets all callers (no filter)
            
            $callers = $callersQuery->get();
            
            if ($callers->isEmpty()) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'No callers available with capacity.'
                ], 400);
            }
            
            // Get unassigned customers based on admin's permissions
            $customersQuery = FilteredCustomer::whereNull('assigned_to')
                ->where('status', '!=', 'COMPLETED');
            
            // Apply same filtering for customers
            if ($admin->role === 'supervisor' && $admin->rtom) {
                $customersQuery->where('RTOM', $admin->rtom);
            } elseif ($admin->role === 'rtom_admin' && $admin->rtom) {
                $customersQuery->where('RTOM', $admin->rtom);
            } elseif ($admin->role === 'region_admin' && $admin->region) {
                $customersQuery->where('REGION', $admin->region);
            }
            
            $customers = $customersQuery->get();
            
            if ($customers->isEmpty()) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'No unassigned customers found.'
                ], 400);
            }
            
            // Calculate available capacity for each caller
            $callerCapacities = $callers->map(function ($caller) {
                return [
                    'caller' => $caller,
                    'available' => $caller->maxLoad - $caller->currentLoad
                ];
            })->filter(function ($item) {
                return $item['available'] > 0;
            })->sortByDesc('available')->values();
            
            if ($callerCapacities->isEmpty()) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'No callers with available capacity.'
                ], 400);
            }
            
            // Distribute customers to callers and group by caller
            $assignmentResults = [];
            $callerAssignments = []; // Track which customers go to which caller
            $customerIndex = 0;
            $totalCustomers = $customers->count();
            
            // Round-robin assignment based on available capacity
            while ($customerIndex < $totalCustomers) {
                $hasCapacity = false;
                
                foreach ($callerCapacities as $index => $capacity) {
                    if ($customerIndex >= $totalCustomers) {
                        break;
                    }
                    
                    $caller = $capacity['caller'];
                    $available = $capacity['available'];
                    
                    if ($available <= 0) {
                        continue;
                    }
                    
                    $hasCapacity = true;
                    
                    // Get customer and track for this caller
                    $customer = $customers[$customerIndex];
                    
                    // Initialize caller assignment tracking
                    if (!isset($callerAssignments[$caller->id])) {
                        $callerAssignments[$caller->id] = [
                            'caller' => $caller,
                            'customer_ids' => []
                        ];
                    }
                    
                    // Add customer to this caller's assignment
                    $callerAssignments[$caller->id]['customer_ids'][] = $customer->id;
                    
                    // Assign customer to this caller
                    $customer->assigned_to = $caller->id;
                    $customer->save();
                    
                    // Update capacity tracking in the collection
                    $callerCapacities[$index]['available']--;
                    
                    // Track assignment for results
                    if (!isset($assignmentResults[$caller->id])) {
                        $assignmentResults[$caller->id] = [
                            'caller_name' => $caller->name,
                            'caller_id' => $caller->callerId,
                            'assigned_count' => 0
                        ];
                    }
                    $assignmentResults[$caller->id]['assigned_count']++;
                    
                    $customerIndex++;
                }
                
                // Break if no callers have capacity left
                if (!$hasCapacity) {
                    break;
                }
            }
            
            // Create Request records for each caller with their assigned customers
            foreach ($callerAssignments as $callerId => $assignment) {
                $caller = $assignment['caller'];
                $customerIds = $assignment['customer_ids'];
                
                TaskRequest::create([
                    'task_id' => 'AUTO-' . time() . '-' . $callerId,
                    'caller_id' => $caller->id,
                    'caller_name' => $caller->name,
                    'customers_sent' => count($customerIds),
                    'sent_date' => now(),
                    'status' => 'PENDING',
                    'customer_ids' => $customerIds
                ]);
            }
            
            DB::commit();
            
            $assignedCount = $customerIndex;
            $remainingCount = $totalCustomers - $assignedCount;
            
            return response()->json([
                'success' => true,
                'message' => "Successfully assigned {$assignedCount} customers to " . count($assignmentResults) . " caller(s).",
                'data' => [
                    'assigned_count' => $assignedCount,
                    'remaining_count' => $remainingCount,
                    'total_customers' => $totalCustomers,
                    'assignments' => array_values($assignmentResults)
                ]
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error during auto-assignment: ' . $e->getMessage()
            ], 500);
        }
    }
}
