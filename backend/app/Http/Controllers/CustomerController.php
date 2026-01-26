<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\FilteredCustomer;
use App\Models\ContactHistory;
use App\Models\Admin;
use Illuminate\Support\Facades\Log;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 401);
            }

            // Start with base query - use FilteredCustomer (working table)
            $query = FilteredCustomer::query();

            // Apply role-based filtering
            if ($user instanceof Admin) {
                // If user is an admin, apply region/RTOM filtering based on role
                if (!$user->isSuperAdmin()) {
                    if ($user->isRegionAdmin() && $user->region) {
                        // Region admin sees all customers in their region
                        $query->where('REGION', $user->region);
                        // If region admin has assignment_type, filter by it
                        if ($user->assignment_type) {
                            $query->where('assignment_type', $user->assignment_type);
                        }
                    } elseif (($user->isRtomAdmin() || $user->isSupervisor()) && $user->rtom) {
                        // RTOM admin and supervisor see only their RTOM
                        $query->where('RTOM', $user->rtom);
                        // If admin/supervisor has assignment_type, filter by it
                        if ($user->assignment_type) {
                            $query->where('assignment_type', $user->assignment_type);
                        }
                    } elseif ($user->rtom) {
                        // Legacy admin role with RTOM
                        $query->where('RTOM', $user->rtom);
                        // If admin has assignment_type, filter by it
                        if ($user->assignment_type) {
                            $query->where('assignment_type', $user->assignment_type);
                        }
                    }
                }
                // Superadmin sees all customers (no filter)
            } else {
                // Caller sees only assigned customers
                $query->where('assigned_to', $user->id);
            }

            // Additional filters from request
            if ($request->has('status')) {
                $status = strtolower($request->status);
                $query->where('status', $status);
            }

            if ($request->has('region')) {
                $query->where('REGION', $request->region);
            }

            if ($request->has('rtom')) {
                $query->where('RTOM', $request->rtom);
            }

            if ($request->has('callerId')) {
                $query->where('assigned_to', $request->callerId);
            }

            $customers = $query->with('contactHistory')->orderBy('created_at', 'desc')->get();

            // Transform to match frontend expectations (consistent with RequestController)
            $mappedCustomers = $customers->map(function ($customer) {
                // Determine status for frontend display (handle case)
                $displayStatus = strtoupper($customer->status);

                // Format contact history items
                $history = $customer->contactHistory->map(function ($item) {
                    return [
                        'contactDate' => $item->contact_date ? $item->contact_date->format('Y-m-d') : null,
                        'promisedDate' => $item->promised_date ? $item->promised_date->format('d/m/Y') : null, // Changed to DD/MM/YYYY
                        'outcome' => $item->outcome,
                        'remark' => $item->remark,
                        'paymentMade' => (bool) $item->payment_made
                    ];
                });

                return array_merge($customer->toArray(), [
                    'id' => $customer->id,
                    'accountNumber' => $customer->ACCOUNT_NUM,
                    'name' => $customer->CUSTOMER_NAME,
                    'contactNumber' => $customer->MOBILE_CONTACT_TEL,
                    'amountOverdue' => $customer->NEW_ARREARS,
                    'daysOverdue' => $customer->AGE_MONTHS,
                    'region' => $customer->REGION,
                    'rtom' => $customer->RTOM,
                    'productLabel' => $customer->PRODUCT_LABEL,
                    'medium' => $customer->MEDIUM,
                    // Keep original status but also provide uppercase for some frontend parts
                    'displayStatus' => $displayStatus,
                    'contactHistory' => $history,
                ]);
            });

            return response()->json([
                'success' => true,
                'data' => $mappedCustomers,
                'count' => $customers->count()
            ]);

        } catch (\Exception $e) {
            Log::error('Customer index error', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch customers',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'ACCOUNT_NUM' => 'required|unique:filtered_customers',
                'CUSTOMER_NAME' => 'required',
                'REGION' => 'nullable|string',
                'RTOM' => 'nullable|string',
                'MOBILE_CONTACT_TEL' => 'nullable|string',
                'EMAIL_ADDRESS' => 'nullable|string',
                'NEW_ARREARS' => 'nullable|numeric',
                'status' => 'nullable|string'
            ]);

            $customer = FilteredCustomer::create($validated);

            return response()->json([
                'success' => true,
                'data' => $customer,
                'message' => 'Customer created successfully'
            ], 201);

        } catch (\Exception $e) {
            Log::error('Customer store error', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to create customer',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(Request $request, $id)
    {
        try {
            $user = $request->user();
            $customer = FilteredCustomer::findOrFail($id);

            // Check if user has access to this customer
            if ($user instanceof Admin && !$user->isSuperAdmin()) {
                if ($user->isRegionAdmin() && $customer->REGION !== $user->region) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Access denied'
                    ], 403);
                } elseif (($user->isRtomAdmin() || $user->isSupervisor()) && $customer->RTOM !== $user->rtom) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Access denied'
                    ], 403);
                }
            }

            return response()->json([
                'success' => true,
                'data' => $customer
            ]);

        } catch (\Exception $e) {
            Log::error('Customer show error', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Customer not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $user = $request->user();
            $customer = FilteredCustomer::findOrFail($id);

            // Check if user has access to update this customer
            if ($user instanceof Admin && !$user->isSuperAdmin()) {
                if ($user->isRegionAdmin() && $customer->REGION !== $user->region) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Access denied'
                    ], 403);
                } elseif (($user->isRtomAdmin() || $user->isSupervisor()) && $customer->RTOM !== $user->rtom) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Access denied'
                    ], 403);
                }
            }

            $customer->update($request->all());

            return response()->json([
                'success' => true,
                'data' => $customer,
                'message' => 'Customer updated successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Customer update error', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to update customer',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Request $request, $id)
    {
        try {
            $user = $request->user();
            $customer = FilteredCustomer::findOrFail($id);

            // Only superadmin can delete customers
            if ($user instanceof Admin && !$user->isSuperAdmin()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only superadmin can delete customers'
                ], 403);
            }

            $customer->delete();

            return response()->json([
                'success' => true,
                'message' => 'Customer deleted successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Customer destroy error', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete customer',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function addContactHistory(Request $request, $id)
    {
        $validated = $request->validate([
            'contact_date' => 'required|date',
            'outcome' => 'required',
            'remark' => 'nullable',
            'promised_date' => 'nullable|date',
            'payment_made' => 'boolean'
        ]);

        $validated['customer_id'] = $id;
        $contactHistory = ContactHistory::create($validated);

        FilteredCustomer::findOrFail($id)->update(['status' => 'contacted']);

        return response()->json($contactHistory, 201);
    }

    public function updateContact(Request $request, $id)
    {
        try {
            $user = $request->user();
            $customer = FilteredCustomer::findOrFail($id);

            // Validate that calling user is the assigned caller
            if ($user && !$user instanceof Admin && $customer->assigned_to != $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. You are not the assigned caller for this customer.'
                ], 403);
            }

            // Validate input - response is optional
            $validated = $request->validate([
                'callOutcome' => 'required|string',
                'customerResponse' => 'nullable|string',
                'paymentMade' => 'nullable|boolean',
                'promisedDate' => 'nullable|string'  // Changed from 'date' to 'string' to handle DD/MM/YYYY format
            ]);

            // Convert promisedDate from DD/MM/YYYY to YYYY-MM-DD if provided
            $promisedDateFormatted = null;
            if (!empty($validated['promisedDate'])) {
                // Check if it's in DD/MM/YYYY format
                if (preg_match('/^(\d{2})\/(\d{2})\/(\d{4})$/', $validated['promisedDate'], $matches)) {
                    $promisedDateFormatted = "{$matches[3]}-{$matches[2]}-{$matches[1]}"; // Convert to YYYY-MM-DD
                } else {
                    // Assume it's already in YYYY-MM-DD format
                    $promisedDateFormatted = $validated['promisedDate'];
                }
            }

            // Create contact history entry
            $contactData = [
                'customer_id' => $id,
                'contact_date' => now(), // Changed from now()->format('Y-m-d') to now() for full datetime
                'outcome' => $validated['callOutcome'],
                'remark' => $validated['customerResponse'] ?? null,
                'promised_date' => $promisedDateFormatted,
                'payment_made' => $validated['paymentMade'] ?? false
            ];

            $contactHistory = ContactHistory::create($contactData);

            // Update customer status based on payment
            if ($validated['paymentMade'] ?? false) {
                // If payment was made, mark as completed
                $customer->update(['status' => 'COMPLETED']);
            } else {
                // Otherwise, mark as pending (contacted but not paid)
                $customer->update(['status' => 'PENDING']);
            }

            return response()->json([
                'success' => true,
                'data' => $contactHistory,
                'message' => 'Contact record saved successfully'
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Contact update validation error', [
                'errors' => $e->errors(),
                'customer_id' => $id
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Contact update error', [
                'error' => $e->getMessage(),
                'customer_id' => $id,
                'line' => $e->getLine(),
                'file' => $e->getFile(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to save contact record',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
