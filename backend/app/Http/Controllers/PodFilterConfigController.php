<?php

namespace App\Http\Controllers;

use App\Models\PodFilterConfig;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class PodFilterConfigController extends Controller
{
    /**
     * Get the current POD filter configuration
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        try {
            $config = PodFilterConfig::getConfig();

            return response()->json([
                'success' => true,
                'data' => $config
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching POD filter config', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch configuration',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update POD filter configuration (Superadmin only)
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), PodFilterConfig::validationRules(), [
                'bill_max.gt' => 'Maximum bill value must be greater than minimum bill value'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $config = PodFilterConfig::getConfig();

            $config->update([
                'bill_min' => $request->bill_min,
                'bill_max' => $request->bill_max,
                'call_center_staff_limit' => $request->call_center_staff_limit,
                'cc_limit' => $request->cc_limit,
                'staff_limit' => $request->staff_limit,
                'updated_by' => $request->user()->id
            ]);

            Log::info('POD filter config updated', [
                'admin_id' => $request->user()->id,
                'admin_email' => $request->user()->email,
                'config' => $config->toArray()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Configuration updated successfully',
                'data' => $config
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating POD filter config', [
                'error' => $e->getMessage()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to update configuration',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reset configuration to default values
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function reset(Request $request)
    {
        try {
            $config = PodFilterConfig::getConfig();

            $config->update([
                'bill_min' => 3000,
                'bill_max' => 10000,
                'call_center_staff_limit' => 30000,
                'cc_limit' => 5000,
                'staff_limit' => 3000,
                'updated_by' => $request->user()->id
            ]);

            Log::info('POD Filter Configuration updated');

            return response()->json([
                'success' => true,
                'message' => 'Configuration reset to default values',
                'data' => $config
            ]);
        } catch (\Exception $e) {
            Log::error('Error resetting POD filter config', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to reset configuration',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
