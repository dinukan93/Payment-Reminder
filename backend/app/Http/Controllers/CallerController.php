<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Caller;
use App\Models\Request as TaskRequest;

class CallerController extends Controller
{
    // Returns the next available callerId (e.g., caller002 if caller001 exists)
    public function nextCallerId(Request $request)
    {
        // Get the highest numeric part of callerId (format: callerXXX)
        $max = Caller::selectRaw("MAX(CAST(SUBSTRING(callerId, 7) AS UNSIGNED)) as max_num")
            ->whereRaw("callerId REGEXP '^caller[0-9]+$'")
            ->first();
        $nextNum = ($max && $max->max_num) ? ((int) $max->max_num + 1) : 1;
        $nextId = 'caller' . str_pad($nextNum, 3, '0', STR_PAD_LEFT);
        return response()->json(['nextCallerId' => $nextId]);
    }
    public function index(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $query = Caller::with(['creator', 'customers']);

        // Apply role-based filtering if user is admin
        if (get_class($user) === 'App\Models\Admin') {
            if ($user->isSuperAdmin()) {
                // Superadmin sees all callers (no filter)
            } elseif ($user->isRegionAdmin() && $user->region) {
                // Region admin sees all callers in their region
                $query->where('region', $user->region);
            } elseif (($user->isRtomAdmin() || $user->isSupervisor()) && $user->rtom) {
                // RTOM admin and supervisor see only callers in their RTOM
                $query->where('rtom', $user->rtom);
            } elseif ($user->rtom) {
                // Legacy admin role with RTOM
                $query->where('rtom', $user->rtom);
            }
        }

        $callers = $query->get();

        // Calculate currentLoad from active requests
        foreach ($callers as $caller) {
            $activeRequests = TaskRequest::where('caller_id', $caller->id)
                ->where('status', 'ACCEPTED')
                ->get();

            $actualLoad = $activeRequests->sum('customers_sent');
            $caller->currentLoad = $actualLoad;
            $caller->save();
        }

        return response()->json($callers);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'name' => 'required',
            'email' => 'required|email|unique:callers',
            'password' => 'required|min:6',
            'callerId' => 'required|unique:callers',
            'phone' => 'nullable',
            'maxLoad' => 'required|integer|min:1|max:100'
        ]);

        // Auto-assign region and RTOM from authenticated admin
        $validated['region'] = $user->region ?? null;
        $validated['rtom'] = $user->rtom ?? null;
        $validated['created_by'] = $user->id;

        return response()->json(Caller::create($validated), 201);
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $caller = Caller::with(['customers', 'requests'])->findOrFail($id);

        // Authorization check - ensure user can only view callers in their scope
        if (get_class($user) === 'App\Models\Admin') {
            if ($user->isSuperAdmin()) {
                // Superadmin can view all callers
            } elseif ($user->isRegionAdmin() && $caller->region !== $user->region) {
                return response()->json(['error' => 'You can only view callers in your region'], 403);
            } elseif (($user->isRtomAdmin() || $user->isSupervisor()) && $caller->rtom !== $user->rtom) {
                return response()->json(['error' => 'You can only view callers in your RTOM'], 403);
            }
        }

        return response()->json($caller);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $caller = Caller::findOrFail($id);

        // Authorization: Only allow updates for callers in same RTOM/region
        if (get_class($user) === 'App\Models\Admin') {
            if ($user->isRegionAdmin() && $caller->region !== $user->region) {
                return response()->json(['error' => 'You can only update callers in your region'], 403);
            } elseif (($user->isRtomAdmin() || $user->isSupervisor()) && $caller->rtom !== $user->rtom) {
                return response()->json(['error' => 'You can only update callers in your RTOM'], 403);
            }
        }

        // Validate input
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:callers,email,' . $id,
            'password' => 'sometimes|nullable|min:6',
            'callerId' => 'sometimes|required|unique:callers,callerId,' . $id,
            'phone' => 'nullable|string|max:20',
            'maxLoad' => 'sometimes|required|integer|min:1|max:100',
            'status' => 'sometimes|in:active,inactive',
            'taskStatus' => 'sometimes|string',
            'assignment_type' => 'sometimes|nullable|string'
        ]);

        // Update caller with validated data only (excluding protected fields)
        $caller->update($validated);

        return response()->json($caller);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        // Only rtom_admin can delete callers
        if (!$user->isRtomAdmin()) {
            return response()->json(['error' => 'Only RTOM Admins can delete callers'], 403);
        }

        $caller = Caller::findOrFail($id);

        // RTOM admin can only delete callers in their RTOM
        if ($caller->rtom !== $user->rtom) {
            return response()->json(['error' => 'You can only delete callers in your RTOM'], 403);
        }

        $caller->delete();
        return response()->json(['message' => 'Caller deleted successfully']);
    }
}
