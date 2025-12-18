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
        $user = $request->attributes->get('user');
        $tokenData = $request->attributes->get('token_data');
        
        $query = Customer::query();
        
        // RTOM filtering
        if ($tokenData->role !== 'superadmin') {
            $query->where('rtom', $user->rtom);
        }
        
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
        $user = $request->attributes->get('user');
        $tokenData = $request->attributes->get('token_data');
        
        $query = Caller::with('customers');
        
        if ($tokenData->role !== 'superadmin') {
            $query->where('rtom', $user->rtom);
        }
        
        return response()->json($query->get());
    }

    public function getWeeklyCalls(Request $request)
    {
        $user = $request->attributes->get('user');
        $tokenData = $request->attributes->get('token_data');
        
        $query = ContactHistory::whereBetween('contact_date', [
            now()->subWeek(),
            now()
        ]);
        
        if ($tokenData->role !== 'superadmin') {
            $query->whereHas('customer', function ($q) use ($user) {
                $q->where('rtom', $user->rtom);
            });
        }
        
        return response()->json(['count' => $query->count()]);
    }

    // Superadmin operations
    public function getAllAdmins()
    {
        // Only get admin and uploader roles, exclude superadmin
        $admins = Admin::whereIn('role', ['admin', 'uploader'])
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
            'role' => 'required|in:admin,uploader',
            'rtom' => 'nullable|in:Colombo,Matara,Negombo,Kandy,Kalutara'
        ]);

        // RTOM is required for admin role
        if ($validated['role'] === 'admin' && empty($validated['rtom'])) {
            return response()->json([
                'success' => false,
                'message' => 'RTOM is required for admin role'
            ], 400);
        }

        // Uploaders don't need RTOM
        if ($validated['role'] === 'uploader') {
            $validated['rtom'] = null;
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
            'role' => 'nullable|in:admin,uploader',
            'rtom' => 'nullable|in:Colombo,Matara,Negombo,Kandy,Kalutara',
            'status' => 'nullable|in:active,inactive'
        ]);

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
}
