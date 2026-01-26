<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Admin;
use App\Models\Caller;
use App\Models\Customer;
use App\Models\Request as TaskRequest;
use App\Models\ContactHistory;

class AdminController extends Controller
{
    public function getDashboardStats(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $query = $user->getAccessibleCustomers();

        $totalCustomers = (clone $query)->count();
        $overdueCustomers = (clone $query)->where('status', 'overdue')->count();
        $contactedCustomers = (clone $query)->where('status', 'contacted')->count();
        $paidCustomers = (clone $query)->where('status', 'paid')->count();

        return response()->json([
            'totalCustomers' => $totalCustomers,
            'overdueCustomers' => $overdueCustomers,
            'contactedCustomers' => $contactedCustomers,
            'paidCustomers' => $paidCustomers
        ]);
    }

    public function getAssignedCallers(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }


        $query = Caller::query();

        // Apply filtering based on user role
        if ($user->isRegionAdmin() && $user->region) {
            $query->where('region', $user->region);
        } elseif ($user->isRtomAdmin() && $user->rtom) {
            $query->where('rtom', $user->rtom);
        } elseif ($user->isSupervisor() && $user->rtom) {
            $query->where('rtom', $user->rtom);
        } elseif (!$user->isSuperAdmin()) {
            // Regular admin with no region/rtom access all callers they created
            $query->where('created_by', $user->id);
        }

        return response()->json($query->get());
    }

    public function getWeeklyCalls(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        // Initialize array for 7 days (Mon-Sun)
        $weeklyCalls = [0, 0, 0, 0, 0, 0, 0];

        // Calculate date range for last 7 days
        $today = now()->endOfDay();
        $sevenDaysAgo = now()->subDays(6)->startOfDay();

        // Get all contact history within the last 7 days
        $query = ContactHistory::whereBetween('contact_date', [
            $sevenDaysAgo,
            $today
        ]);

        // Apply filtering based on user role
        if ($user->isRegionAdmin() && $user->region) {
            $query->whereHas('customer', function ($q) use ($user) {
                $q->where('REGION', $user->region);
            });
        } elseif (($user->isRtomAdmin() || $user->isSupervisor()) && $user->rtom) {
            $query->whereHas('customer', function ($q) use ($user) {
                $q->where('RTOM', $user->rtom);
            });
        }

        // Get all contacts and group by day of week
        $contacts = $query->get();

        foreach ($contacts as $contact) {
            $contactDate = \Carbon\Carbon::parse($contact->contact_date);

            // Only count if within our 7-day window
            if ($contactDate >= $sevenDaysAgo && $contactDate <= $today) {
                // Get day of week (0 = Sunday, 6 = Saturday)
                $dayOfWeek = $contactDate->dayOfWeek;

                // Convert to Monday-first index (0 = Monday, 6 = Sunday)
                $mondayFirstIndex = $dayOfWeek === 0 ? 6 : $dayOfWeek - 1;

                $weeklyCalls[$mondayFirstIndex]++;
            }
        }

        return response()->json(['data' => $weeklyCalls]);
    }

    // Superadmin operations
    public function getAllAdmins()
    {
        // Get all admin types, exclude superadmin
        $admins = Admin::whereIn('role', ['admin', 'region_admin', 'rtom_admin', 'supervisor', 'uploader'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $admins,
            'count' => $admins->count()
        ]);
    }

    public function createAdmin(Request $request)
    {
        // Validate inputs
        $validated = $request->validate([
            'adminId' => 'required|unique:admins',
            'name' => 'required',
            'email' => 'required|email|unique:admins',
            'phone' => 'nullable',
            'password' => 'required|min:6',
            'role' => 'required|in:admin,region_admin,rtom_admin,supervisor,uploader',
            'region' => 'nullable|string',
            'rtom' => 'nullable|string'
        ]);

        // Region is required for region_admin
        if ($validated['role'] === 'region_admin' && empty($validated['region'])) {
            return response()->json([
                'success' => false,
                'message' => 'Region is required for region admin role'
            ], 400);
        }

        // RTOM is required for rtom_admin and supervisor
        if (in_array($validated['role'], ['rtom_admin', 'supervisor']) && empty($validated['rtom'])) {
            return response()->json([
                'success' => false,
                'message' => 'RTOM is required for RTOM admin and supervisor roles'
            ], 400);
        }

        // Auto-assign region based on RTOM for rtom_admin and supervisor
        if (in_array($validated['role'], ['rtom_admin', 'supervisor']) && !empty($validated['rtom'])) {
            $validated['region'] = $this->getRegionForRtom($validated['rtom']);
        }

        // Uploaders don't need RTOM or region
        if ($validated['role'] === 'uploader') {
            $validated['rtom'] = null;
            $validated['region'] = null;
        }

        // Admins created by superadmin are auto-verified
        $validated['status'] = 'active';

        $admin = Admin::create($validated);

        return response()->json([
            'success' => true,
            'message' => ucfirst($validated['role']) . ' created successfully',
            'data' => $admin
        ], 201);
    }

    public function updateAdmin(Request $request, $id)
    {
        $admin = Admin::findOrFail($id);

        // Prevent updating superadmin
        if ($admin->role === 'superadmin') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot modify superadmin account'
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'nullable',
            'email' => 'nullable|email|unique:admins,email,' . $id,
            'phone' => 'nullable',
            'role' => 'nullable|in:admin,region_admin,rtom_admin,supervisor,uploader',
            'region' => 'nullable|string',
            'rtom' => 'nullable|string',
            'status' => 'nullable|in:active,inactive'
        ]);

        // Auto-assign region based on RTOM for rtom_admin and supervisor
        if (isset($validated['rtom']) && in_array($validated['role'] ?? $admin->role, ['rtom_admin', 'supervisor'])) {
            $validated['region'] = $this->getRegionForRtom($validated['rtom']);
        }

        // Don't allow password updates through this endpoint
        $admin->update($request->except(['password', 'adminId']));

        return response()->json([
            'success' => true,
            'message' => 'Admin updated successfully',
            'data' => $admin
        ]);
    }

    public function deleteAdmin($id)
    {
        $admin = Admin::findOrFail($id);

        // Prevent deleting superadmin
        if ($admin->role === 'superadmin') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete superadmin account'
            ], 403);
        }

        $admin->delete();

        return response()->json([
            'success' => true,
            'message' => 'Admin deleted successfully'
        ]);
    }

    public function getRtoms()
    {
        return response()->json([
            'success' => true,
            'data' => ['Colombo', 'Matara', 'Negombo', 'Kandy', 'Kalutara']
        ]);
    }

    /**
     * Get RTOM admins for the region admin's region
     */
    public function getRtomAdminsForRegion(Request $request)
    {
        $user = $request->user();

        if (!$user || !$user->isRegionAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        // Get all RTOM admins in the region admin's region
        $rtomAdmins = Admin::where('role', 'rtom_admin')
            ->where('region', $user->region)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $rtomAdmins,
            'count' => $rtomAdmins->count()
        ]);
    }

    /**
     * Get region for a given RTOM code
     */
    private function getRegionForRtom($rtomCode)
    {
        $rtomToRegionMap = $this->getRtomToRegionMap();
        return $rtomToRegionMap[$rtomCode] ?? null;
    }

    /**
     * Get RTOM to Region mapping
     */
    private function getRtomToRegionMap()
    {
        return [
            'Colombo' => 'Western',
            'Matara' => 'Southern',
            'Negombo' => 'Western',
            'Kandy' => 'Central',
            'Kalutara' => 'Western'
        ];
    }

    /**
     * Create a new RTOM admin (Region Admin only)
     */
    public function createRtomAdmin(Request $request)
    {
        $user = $request->user();

        if (!$user || !$user->isRegionAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        // Validate inputs
        $validated = $request->validate([
            'adminId' => 'required|unique:admins',
            'name' => 'required',
            'email' => 'required|email|unique:admins',
            'phone' => 'nullable',
            'password' => 'required|min:6',
            'rtom' => 'required|string'
        ]);

        // Force role to rtom_admin and region to the region admin's region
        $validated['role'] = 'rtom_admin';
        $validated['region'] = $user->region;
        $validated['status'] = 'active';

        $admin = Admin::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'RTOM admin created successfully',
            'data' => $admin
        ], 201);
    }

    /**
     * Update an RTOM admin (Region Admin only)
     */
    public function updateRtomAdmin(Request $request, $id)
    {
        $user = $request->user();

        if (!$user || !$user->isRegionAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        $admin = Admin::findOrFail($id);

        // Ensure the RTOM admin belongs to the region admin's region
        if ($admin->region !== $user->region || $admin->role !== 'rtom_admin') {
            return response()->json([
                'success' => false,
                'message' => 'You can only update RTOM admins in your region'
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'nullable',
            'email' => 'nullable|email|unique:admins,email,' . $id,
            'phone' => 'nullable',
            'password' => 'nullable|min:6',
            'rtom' => 'nullable|string'
        ]);

        // Don't allow changing role or region
        unset($validated['role'], $validated['region']);

        // Only update password if provided
        if (empty($validated['password'])) {
            unset($validated['password']);
        }

        $admin->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'RTOM admin updated successfully',
            'data' => $admin
        ]);
    }

    /**
     * Delete an RTOM admin (Region Admin only)
     */
    public function deleteRtomAdmin(Request $request, $id)
    {
        $user = $request->user();

        if (!$user || !$user->isRegionAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        $admin = Admin::findOrFail($id);

        // Ensure the RTOM admin belongs to the region admin's region
        if ($admin->region !== $user->region || $admin->role !== 'rtom_admin') {
            return response()->json([
                'success' => false,
                'message' => 'You can only delete RTOM admins in your region'
            ], 403);
        }

        $admin->delete();

        return response()->json([
            'success' => true,
            'message' => 'RTOM admin deleted successfully'
        ]);
    }

    /**
     * Get supervisors for the RTOM admin's RTOM
     */
    public function getSupervisorsForRtom(Request $request)
    {
        $user = $request->user();

        if (!$user || !$user->isRtomAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        // Get all supervisors in the RTOM admin's RTOM
        $supervisors = Admin::where('role', 'supervisor')
            ->where('rtom', $user->rtom)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $supervisors,
            'count' => $supervisors->count()
        ]);
    }

    /**
     * Create a new supervisor (RTOM Admin only)
     */
    public function createSupervisor(Request $request)
    {
        $user = $request->user();

        if (!$user || !$user->isRtomAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        // Validate inputs
        $validated = $request->validate([
            'adminId' => 'required|unique:admins',
            'name' => 'required',
            'email' => 'required|email|unique:admins',
            'phone' => 'nullable',
            'password' => 'required|min:6'
        ]);

        // Force role to supervisor and RTOM/region to the RTOM admin's values
        $validated['role'] = 'supervisor';
        $validated['rtom'] = $user->rtom;
        $validated['region'] = $user->region;
        $validated['status'] = 'active';

        $admin = Admin::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Supervisor created successfully',
            'data' => $admin
        ], 201);
    }

    /**
     * Update a supervisor (RTOM Admin only)
     */
    public function updateSupervisor(Request $request, $id)
    {
        $user = $request->user();

        if (!$user || !$user->isRtomAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        $admin = Admin::findOrFail($id);

        // Ensure the supervisor belongs to the RTOM admin's RTOM
        if ($admin->rtom !== $user->rtom || $admin->role !== 'supervisor') {
            return response()->json([
                'success' => false,
                'message' => 'You can only update supervisors in your RTOM'
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'nullable',
            'email' => 'nullable|email|unique:admins,email,' . $id,
            'phone' => 'nullable',
            'password' => 'nullable|min:6'
        ]);

        // Don't allow changing role, rtom, or region
        unset($validated['role'], $validated['rtom'], $validated['region']);

        // Only update password if provided
        if (empty($validated['password'])) {
            unset($validated['password']);
        }

        $admin->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Supervisor updated successfully',
            'data' => $admin
        ]);
    }

    /**
     * Delete a supervisor (RTOM Admin only)
     */
    public function deleteSupervisor(Request $request, $id)
    {
        $user = $request->user();

        if (!$user || !$user->isRtomAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        $admin = Admin::findOrFail($id);

        // Ensure the supervisor belongs to the RTOM admin's RTOM
        if ($admin->rtom !== $user->rtom || $admin->role !== 'supervisor') {
            return response()->json([
                'success' => false,
                'message' => 'You can only delete supervisors in your RTOM'
            ], 403);
        }

        $admin->delete();

        return response()->json([
            'success' => true,
            'message' => 'Supervisor deleted successfully'
        ]);
    }
}
