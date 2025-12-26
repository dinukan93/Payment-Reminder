<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Admin;

// ...existing code...

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

        $query = Caller::with('customers');

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

        $query = ContactHistory::whereBetween('contact_date', [
            now()->subWeek(),
            now()
        ]);

        // Apply filtering based on user role
        if ($user->isRegionAdmin() && $user->region) {
            $query->whereHas('customer', function ($q) use ($user) {
                $q->where('region', $user->region);
            });
        } elseif (($user->isRtomAdmin() || $user->isSupervisor()) && $user->rtom) {
            $query->whereHas('customer', function ($q) use ($user) {
                $q->where('rtom', $user->rtom);
            });
        }

        return response()->json(['count' => $query->count()]);
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
     * Get RTOM admins for the logged-in region admin
     */
    public function getRtomAdminsForRegion(Request $request)
    {
        $user = $request->user();

        if (!$user || !$user->isRegionAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only region admins can access this.'
            ], 403);
        }

        if (!$user->region) {
            return response()->json([
                'success' => false,
                'message' => 'Region not assigned to your account'
            ], 400);
        }

        // Get all RTOM admins in the same region
        $rtomAdmins = Admin::where('role', 'rtom_admin')
            ->where('region', $user->region)
            ->get()
            ->map(function ($admin) {
                // Count callers for this RTOM admin
                $callersCount = Caller::where('rtom', $admin->rtom)->count();

                // Count customers contacted in this RTOM (using RTOM column directly)
                $customersContacted = ContactHistory::whereHas('customer', function ($q) use ($admin) {
                    $q->where('RTOM', $admin->rtom);
                })->distinct('customer_id')->count();

                return [
                    'id' => $admin->id,
                    'adminId' => $admin->adminId,
                    'name' => $admin->name,
                    'email' => $admin->email,
                    'phone' => $admin->phone,
                    'rtom' => $admin->rtom,
                    'region' => $admin->region,
                    'status' => $admin->status,
                    'created_at' => $admin->created_at,
                    'callers_count' => $callersCount,
                    'customers_contacted' => $customersContacted
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $rtomAdmins
        ]);
    }

    /**
     * Create RTOM admin (Region Admin only)
     */
    public function createRtomAdmin(Request $request)
    {
        $user = $request->user();

        if (!$user || !$user->isRegionAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only region admins can create RTOM admins.'
            ], 403);
        }

        if (!$user->region) {
            return response()->json([
                'success' => false,
                'message' => 'Region not assigned to your account'
            ], 400);
        }

        // Validate inputs
        $validated = $request->validate([
            'adminId' => 'required|unique:admins',
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:admins',
            'phone' => 'nullable|string|max:20',
            'password' => 'required|min:6',
            'rtom' => 'required|string'
        ]);

        // Auto-assign region based on RTOM
        $rtomRegion = $this->getRegionForRtom($validated['rtom']);

        if (!$rtomRegion) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid RTOM code'
            ], 400);
        }

        // Ensure RTOM belongs to region admin's region
        if ($rtomRegion !== $user->region) {
            return response()->json([
                'success' => false,
                'message' => 'RTOM does not belong to your region'
            ], 403);
        }

        // Create RTOM admin
        $validated['role'] = 'rtom_admin';
        $validated['region'] = $rtomRegion;
        $validated['status'] = 'active';

        $admin = Admin::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'RTOM admin created successfully',
            'data' => $admin
        ], 201);
    }

    /**
     * Update RTOM admin (Region Admin only)
     */
    public function updateRtomAdmin(Request $request, $id)
    {
        $user = $request->user();

        if (!$user || !$user->isRegionAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only region admins can update RTOM admins.'
            ], 403);
        }

        if (!$user->region) {
            return response()->json([
                'success' => false,
                'message' => 'Region not assigned to your account'
            ], 400);
        }

        $admin = Admin::findOrFail($id);

        // Ensure admin is RTOM admin
        if ($admin->role !== 'rtom_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Can only update RTOM admins'
            ], 403);
        }

        // Ensure RTOM admin belongs to region admin's region
        if ($admin->region !== $user->region) {
            return response()->json([
                'success' => false,
                'message' => 'RTOM admin does not belong to your region'
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'email' => 'nullable|email|unique:admins,email,' . $id,
            'phone' => 'nullable|string|max:20',
            'rtom' => 'nullable|string',
            'status' => 'nullable|in:active,inactive'
        ]);

        // If RTOM is being updated, verify it belongs to the same region
        if (isset($validated['rtom'])) {
            $rtomRegion = $this->getRegionForRtom($validated['rtom']);

            if (!$rtomRegion) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid RTOM code'
                ], 400);
            }

            if ($rtomRegion !== $user->region) {
                return response()->json([
                    'success' => false,
                    'message' => 'RTOM does not belong to your region'
                ], 403);
            }

            $validated['region'] = $rtomRegion;
        }

        // Don't allow password or role updates through this endpoint
        $admin->update($request->except(['password', 'adminId', 'role']));

        return response()->json([
            'success' => true,
            'message' => 'RTOM admin updated successfully',
            'data' => $admin
        ]);
    }

    /**
     * Delete RTOM admin (Region Admin only)
     */
    public function deleteRtomAdmin($id)
    {
        $user = request()->user();

        if (!$user || !$user->isRegionAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only region admins can delete RTOM admins.'
            ], 403);
        }

        if (!$user->region) {
            return response()->json([
                'success' => false,
                'message' => 'Region not assigned to your account'
            ], 400);
        }

        $admin = Admin::findOrFail($id);

        // Ensure admin is RTOM admin
        if ($admin->role !== 'rtom_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Can only delete RTOM admins'
            ], 403);
        }

        // Ensure RTOM admin belongs to region admin's region
        if ($admin->region !== $user->region) {
            return response()->json([
                'success' => false,
                'message' => 'RTOM admin does not belong to your region'
            ], 403);
        }

        $admin->delete();

        return response()->json([
            'success' => true,
            'message' => 'RTOM admin deleted successfully'
        ]);
    }

    /**
     * Get available RTOMs for the logged-in region admin's region
     */
    public function getAvailableRtomsForRegion(Request $request)
    {
        $user = $request->user();

        if (!$user || !$user->isRegionAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        if (!$user->region) {
            return response()->json([
                'success' => false,
                'message' => 'Region not assigned'
            ], 400);
        }

        // Get all RTOMs for this region
        $rtomData = $this->getRtomData();
        $availableRtoms = [];

        foreach ($rtomData as $code => $data) {
            if ($data['region'] === $user->region) {
                $availableRtoms[] = [
                    'code' => $code,
                    'name' => $data['name']
                ];
            }
        }

        return response()->json([
            'success' => true,
            'data' => $availableRtoms
        ]);
    }

    /**
     * Get RTOM data with codes, names, and regions
     */
    private function getRtomData()
    {
        return [
            // Metro Region
            'CO' => ['name' => 'Colombo Central (General)', 'region' => 'Metro Region'],
            'MA' => ['name' => 'Maradana', 'region' => 'Metro Region'],
            'ND' => ['name' => 'Nugegoda', 'region' => 'Metro Region'],
            'HK' => ['name' => 'Havelock Town', 'region' => 'Metro Region'],
            'KX' => ['name' => 'Kotte', 'region' => 'Metro Region'],
            'WT' => ['name' => 'Wattala', 'region' => 'Metro Region'],
            'RM' => ['name' => 'Ratmalana', 'region' => 'Metro Region'],

            // Region 1
            'AN' => ['name' => 'Anuradhapura', 'region' => 'Region 1'],
            'CW' => ['name' => 'Chilaw', 'region' => 'Region 1'],
            'GP' => ['name' => 'Gampola', 'region' => 'Region 1'],
            'KA' => ['name' => 'Kandy', 'region' => 'Region 1'],
            'KU' => ['name' => 'Kurunegala', 'region' => 'Region 1'],
            'MT' => ['name' => 'Matale', 'region' => 'Region 1'],
            'NE' => ['name' => 'Negombo', 'region' => 'Region 1'],
            'PO' => ['name' => 'Polonnaruwa', 'region' => 'Region 1'],
            'KI' => ['name' => 'Identifier currently unknown', 'region' => 'Region 1'],

            // Region 2
            'AV' => ['name' => 'Avissawella', 'region' => 'Region 2'],
            'BA' => ['name' => 'Badulla', 'region' => 'Region 2'],
            'BW' => ['name' => 'Bandarawela', 'region' => 'Region 2'],
            'GA' => ['name' => 'Galle', 'region' => 'Region 2'],
            'HB' => ['name' => 'Hambantota', 'region' => 'Region 2'],
            'HA' => ['name' => 'Hatton', 'region' => 'Region 2'],
            'KL' => ['name' => 'Kalutara', 'region' => 'Region 2'],
            'KG' => ['name' => 'Kegalle', 'region' => 'Region 2'],
            'NW' => ['name' => 'Nuwara Eliya', 'region' => 'Region 2'],
            'RA' => ['name' => 'Ratnapura', 'region' => 'Region 2'],

            // Region 3
            'AM' => ['name' => 'Ampara', 'region' => 'Region 3'],
            'BT' => ['name' => 'Batticaloa', 'region' => 'Region 3'],
            'JA' => ['name' => 'Jaffna', 'region' => 'Region 3'],
            'KM' => ['name' => 'Kalmunai', 'region' => 'Region 3'],
            'KO' => ['name' => 'Mannar', 'region' => 'Region 3'],
            'TR' => ['name' => 'Trincomalee', 'region' => 'Region 3'],
            'VU' => ['name' => 'Vavuniya', 'region' => 'Region 3'],
        ];
    }

    /**
     * Get RTOM to region mapping (legacy support)
     */
    private function getRtomToRegionMap()
    {
        $rtomData = $this->getRtomData();
        $map = [];
        foreach ($rtomData as $code => $data) {
            $map[$code] = $data['region'];
        }
        return $map;
    }

    /**
     * Get region for a given RTOM code
     */
    private function getRegionForRtom($rtomCode)
    {
        $rtomToRegionMap = $this->getRtomToRegionMap();
        return $rtomToRegionMap[$rtomCode] ?? null;
    }
}
