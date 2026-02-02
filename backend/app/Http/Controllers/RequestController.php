<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Request as TaskRequest;
use App\Models\Caller;
use App\Models\Customer;
use App\Models\FilteredCustomer;
use App\Models\Admin;
use Illuminate\Support\Facades\Log;

class RequestController extends Controller
{
    public function index(Request $request)
    {
        try {
            $user = $request->user();

            Log::info('RequestController index called', [
                'user' => $user ? get_class($user) : 'null',
                'user_id' => $user ? $user->id : 'null',
                'query_params' => $request->all()
            ]);

            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $query = TaskRequest::query();

            if ($user instanceof Caller) {
                Log::info('User is a Caller', ['caller_id' => $user->id]);
                $query->where('caller_id', $user->id);

                if ($request->has('status')) {
                    $query->where('status', $request->status);
                }
            } elseif ($user instanceof Admin) {
                Log::info('User is an Admin', ['admin_id' => $user->id]);
                if ($request->has('callerId')) {
                    $query->where('caller_id', $request->callerId);
                }

                if ($request->has('status')) {
                    $query->where('status', $request->status);
                }

                if (!$user->isSuperAdmin()) {
                    $callerQuery = Caller::query();

                    if ($user->isRegionAdmin() && $user->region) {
                        $callerQuery->where('region', $user->region);
                    } elseif (($user->isRtomAdmin() || $user->isSupervisor()) && $user->rtom) {
                        $callerQuery->where('rtom', $user->rtom);
                    }

                    $callerIds = $callerQuery->pluck('id')->toArray();

                    if (!empty($callerIds)) {
                        $query->whereIn('caller_id', $callerIds);
                    } else {
                        $query->whereRaw('1 = 0');
                    }
                }
            } else {
                Log::warning('User is neither Caller nor Admin', ['user_class' => get_class($user)]);
            }

            $results = $query->orderBy('sent_date', 'desc')->get();

            $results->transform(function ($req) {
                if (!empty($req->customer_ids)) {
                    $customers = FilteredCustomer::whereIn('id', $req->customer_ids)->get();
                    $req->customers = $customers->map(function ($customer) {
                        return [
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
                            'status' => $customer->status
                        ];
                    });
                } else {
                    $req->customers = [];
                }
                return $req;
            });

            Log::info('Returning results', ['count' => $results->count()]);

            return response()->json($results);
        } catch (\Exception $e) {
            Log::error('Request index error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'error' => 'Failed to fetch requests',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'caller_id' => 'required|exists:callers,id',
            'customer_ids' => 'required|array'
        ]);

        $caller = Caller::findOrFail($validated['caller_id']);

        $user = $request->user();
        Log::info('Creating request - authenticated user:', [
            'user' => $user,
            'user_id' => $user ? $user->id : null,
            'user_name' => $user ? $user->name : null,
            'user_type' => $user ? get_class($user) : null
        ]);

        $sentBy = 'Admin';
        if ($user) {
            $sentBy = $user->name ?? $user->username ?? $user->email ?? 'Admin';
        }

        Log::info('Determined sent_by value:', ['sent_by' => $sentBy]);

        $taskRequest = TaskRequest::create([
            'task_id' => 'TASK-' . time() . '-' . rand(1000, 9999),
            'caller_id' => $caller->id,
            'caller_name' => $caller->name,
            'customers_sent' => count($validated['customer_ids']),
            'sent_date' => now(),
            'status' => 'PENDING',
            'customer_ids' => $validated['customer_ids'],
            'sent_by' => $sentBy
        ]);

        return response()->json($taskRequest, 201);
    }

    public function show($id)
    {
        return response()->json(TaskRequest::with('caller')->findOrFail($id));
    }

    public function accept(Request $request, $id)
    {
        $taskRequest = TaskRequest::findOrFail($id);

        if ($taskRequest->status === 'ACCEPTED') {
            return response()->json($taskRequest);
        }

        $taskRequest->update(['status' => 'ACCEPTED']);

        if ($taskRequest->customer_ids) {
            FilteredCustomer::whereIn('id', $taskRequest->customer_ids)
                ->update([
                    'assigned_to' => $taskRequest->caller_id,
                    'status' => 'overdue'
                ]);
        }

        $caller = $taskRequest->caller;

        $assignedCount = FilteredCustomer::where('assigned_to', $caller->id)
            ->where('status', '!=', 'COMPLETED')
            ->count();

        $caller->currentLoad = $assignedCount;

        if ($caller->currentLoad > 0) {
            $caller->taskStatus = 'busy';
        }

        $caller->save();

        return response()->json($taskRequest);
    }

    public function decline(Request $request, $id)
    {
        $taskRequest = TaskRequest::findOrFail($id);
        $taskRequest->update(['status' => 'DECLINED']);

        FilteredCustomer::whereIn('id', $taskRequest->customer_ids)
            ->update(['assigned_to' => null]);

        return response()->json($taskRequest);
    }

    public function cancel(Request $request, $id)
    {
        $user = $request->user();

        if (!($user instanceof Admin)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only admins can cancel requests.'
            ], 403);
        }

        $taskRequest = TaskRequest::findOrFail($id);

        if (in_array($taskRequest->status, ['ACCEPTED', 'DECLINED', 'CANCELLED'])) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot cancel a request that has already been ' . strtolower($taskRequest->status) . '.'
            ], 400);
        }

        if ($user->role === 'supervisor' || $user->role === 'rtom_admin') {
            $caller = Caller::find($taskRequest->caller_id);
            if ($caller && $caller->rtom !== $user->rtom) {
                return response()->json([
                    'success' => false,
                    'message' => 'You can only cancel requests in your RTOM.'
                ], 403);
            }
        } elseif ($user->role === 'region_admin') {
            $caller = Caller::find($taskRequest->caller_id);
            if ($caller && $caller->region !== $user->region) {
                return response()->json([
                    'success' => false,
                    'message' => 'You can only cancel requests in your region.'
                ], 403);
            }
        }

        $taskRequest->update(['status' => 'CANCELLED']);

        if ($taskRequest->customer_ids) {
            FilteredCustomer::whereIn('id', $taskRequest->customer_ids)
                ->update(['assigned_to' => null]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Request cancelled successfully.',
            'data' => $taskRequest
        ]);
    }

    public function update(Request $request, $id)
    {
        $taskRequest = TaskRequest::findOrFail($id);
        $taskRequest->update($request->all());
        return response()->json($taskRequest);
    }
}
