<?php

namespace App\Http\Controllers;

use App\Models\FilteredCustomer;
use App\Models\Customer;
use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class DataDistributionController extends Controller
{
    /**
     * Distribute filtered customer data to regions and RTOMs
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function distributeToRegionsAndRtoms(Request $request)
    {
        try {
            // Log incoming request for debugging
            \Log::info('Distribution request received', [
                'customer_count' => count($request->input('customers', [])),
                'sample_data' => array_slice($request->input('customers', []), 0, 2)
            ]);

            $validator = Validator::make($request->all(), [
                'customers' => 'required|array|min:1',
            ]);

            if ($validator->fails()) {
                \Log::error('Distribution validation failed', [
                    'errors' => $validator->errors()->toArray()
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $customersData = $request->customers;

            // Normalize account field names
            $customersData = array_map(function ($customer) {
                if (isset($customer['ACCOUNT_NUM']) && !isset($customer['ACCOUNT_NUMBER'])) {
                    $customer['ACCOUNT_NUMBER'] = $customer['ACCOUNT_NUM'];
                }
                return $customer;
            }, $customersData);

            $created = 0;
            $updated = 0;
            $errors = [];
            $distribution = [
                'Metro Region' => 0,
                'Region 1' => 0,
                'Region 2' => 0,
                'Region 3' => 0,
                'Unassigned' => 0
            ];

            foreach ($customersData as $customerData) {
                try {
                    // Helper function to clean and convert numeric values
                    $cleanNumeric = function ($value) {
                        if ($value === null || $value === '' || $value === 'NULL') {
                            return null;
                        }
                        // Remove commas and convert to float
                        $cleaned = str_replace(',', '', trim($value));
                        return $cleaned !== '' ? floatval($cleaned) : null;
                    };

                    // Find NEW_ARREARS column dynamically (can be NEW_ARREAR_S_20251221, NEW_ARREARS_20260121, etc.)
                    $newArrearsValue = null;
                    $newArrearsKey = null;
                    foreach ($customerData as $key => $value) {
                        if (preg_match('/^NEW_ARREAR[S]?_\d{8}$/i', $key)) {
                            $newArrearsKey = $key;
                            $newArrearsValue = $cleanNumeric($value);
                            break;
                        }
                    }

                    // Log first record to debug
                    static $logged = false;
                    if (!$logged) {
                        \Log::info('Sample customer data:', [
                            'LATEST_BILL_MNY_raw' => $customerData['LATEST_BILL_MNY'] ?? 'NOT_FOUND',
                            'LATEST_BILL_MNY_cleaned' => $cleanNumeric($customerData['LATEST_BILL_MNY'] ?? null),
                            'NEW_ARREARS_key' => $newArrearsKey,
                            'NEW_ARREARS_raw' => $newArrearsKey ? $customerData[$newArrearsKey] : 'NOT_FOUND',
                            'NEW_ARREARS_cleaned' => $newArrearsValue,
                            'assignedTo' => $customerData['assignedTo'] ?? 'NOT_FOUND',
                            'all_keys' => array_keys($customerData)
                        ]);
                        $logged = true;
                    }

                    // Extract assignment_type value
                    $assignmentType = $customerData['assignedTo'] ?? null;

                    // Step 1: Save to filtered_customers with essential columns for caller work
                    $filteredCustomer = FilteredCustomer::updateOrCreate(
                        ['ACCOUNT_NUM' => $customerData['ACCOUNT_NUMBER']],
                        [
                            'REGION' => $customerData['REGION'] ?? null,
                            'RTOM' => $customerData['RTOM'] ?? null,
                            'PRODUCT_LABEL' => $customerData['PRODUCT_LABEL'] ?? null,
                            'MEDIUM' => $customerData['MEDIUM'] ?? null,
                            'CUSTOMER_NAME' => $customerData['ADDRESS_NAME'] ?? null,
                            'LATEST_BILL_MNY' => $cleanNumeric($customerData['LATEST_BILL_MNY'] ?? null),
                            'NEW_ARREARS' => $newArrearsValue,
                            'CREDIT_SCORE' => $customerData['CREDIT_SCORE'] ?? null,
                            'ACCOUNT_MANAGER' => $customerData['ACCOUNT_MANAGER'] ?? null,
                            'BILL_HANDLING_CODE_NAME' => $customerData['BILL_HANDLING_CODE_NAME'] ?? null,
                            'MOBILE_CONTACT_TEL' => $customerData['MOBILE_CONTACT_TEL'] ?? null,
                            'EMAIL_ADDRESS' => $customerData['EMAIL_ADDRESS'] ?? null,
                            'NEXT_BILL_DATE' => $customerData['NEXT_BILL_DTM'] ?? null,
                            'AGE_MONTHS' => isset($customerData['AGE_MONTHS']) ? intval($customerData['AGE_MONTHS']) : null,
                            'SALES_PERSON' => $customerData['SALES_PERSON'] ?? null,
                            'CREDIT_CLASS_NAME' => $customerData['CREDIT_CLASS_NAME'] ?? null,
                            'REMARK' => $customerData['Remark'] ?? null,
                            'status' => 'pending',
                            'assignment_type' => $assignmentType,
                        ]
                    );

                    // Step 2: Populate customers table with ALL Excel columns (raw data only)
                    $customerRecord = Customer::updateOrCreate(
                        ['ACCOUNT_NUM' => $customerData['ACCOUNT_NUMBER']],
                        [
                            'RUN_DATE' => $customerData['RUN_DATE'] ?? null,
                            'REGION' => $customerData['REGION'] ?? null,
                            'RTOM' => $customerData['RTOM'] ?? null,
                            'CUSTOMER_REF' => $customerData['CUSTOMER_REF'] ?? null,
                            'PRODUCT_LABEL' => $customerData['PRODUCT_LABEL'] ?? null,
                            'MEDIUM' => $customerData['MEDIUM'] ?? null,
                            'CUSTOMER_SEGMENT' => $customerData['CUSTOMER_SEGMENT'] ?? null,
                            'ADDRESS_NAME' => $customerData['ADDRESS_NAME'] ?? null,
                            'FULL_ADDRESS' => $customerData['FULL_ADDRESS'] ?? null,
                            'LATEST_BILL_MNY' => $cleanNumeric($customerData['LATEST_BILL_MNY'] ?? null),
                            'NEW_ARREARS' => $newArrearsValue,
                            'MOBILE_CONTACT_TEL' => $customerData['MOBILE_CONTACT_TEL'] ?? null,
                            'EMAIL_ADDRESS' => $customerData['EMAIL_ADDRESS'] ?? null,
                            'CREDIT_SCORE' => $customerData['CREDIT_SCORE'] ?? null,
                            'CREDIT_CLASS_NAME' => $customerData['CREDIT_CLASS_NAME'] ?? null,
                            'BILL_HANDLING_CODE_NAME' => $customerData['BILL_HANDLING_CODE_NAME'] ?? null,
                            'AGE_MONTHS' => isset($customerData['AGE_MONTHS']) ? intval($customerData['AGE_MONTHS']) : null,
                            'SALES_PERSON' => $customerData['SALES_PERSON'] ?? null,
                            'ACCOUNT_MANAGER' => $customerData['ACCOUNT_MANAGER'] ?? null,
                            'SLT_GL_SUB_SEGMENT' => $customerData['SLT_GL_SUB_SEGMENT'] ?? null,
                            'BILLING_CENTRE' => $customerData['BILLING_CENTRE'] ?? null,
                            'PROVINCE' => $customerData['PROVINCE'] ?? null,
                            'NEXT_BILL_DTM' => $customerData['NEXT_BILL_DTM'] ?? null,
                            'BILL_MONTH' => $customerData['BILL_MONTH'] ?? null,
                            'LATEST_BILL_DTM' => $customerData['LATEST_BILL_DTM'] ?? null,
                            'INVOICING_CO_ID' => $customerData['INVOICING_CO_ID'] ?? null,
                            'INVOICING_CO_NAME' => $customerData['INVOICING_CO_NAME'] ?? null,
                            'PRODUCT_SEQ' => $customerData['PRODUCT_SEQ'] ?? null,
                            'PRODUCT_ID' => $customerData['PRODUCT_ID'] ?? null,
                            'LATEST_PRODUCT_STATUS' => $customerData['LATEST_PRODUCT_STATUS'] ?? null,
                            'BILL_HANDLING_CODE' => $customerData['BILL_HANDLING_CODE'] ?? null,
                            'SLT_BUSINESS_LINE_VALUE' => $customerData['SLT_BUSINESS_LINE_VALUE'] ?? null,
                            'SALES_CHANNEL' => $customerData['SALES_CHANNEL'] ?? null,
                        ]
                    );

                    if ($customerRecord->wasRecentlyCreated) {
                        $created++;
                    } else {
                        $updated++;
                    }

                    // Track distribution
                    if (isset($customerData['REGION'])) {
                        $distribution[$customerData['REGION']] = ($distribution[$customerData['REGION']] ?? 0) + 1;
                    } else {
                        $distribution['Unassigned']++;
                    }

                } catch (\Exception $e) {
                    $errors[] = [
                        'accountNumber' => $customerData['ACCOUNT_NUMBER'],
                        'error' => $e->getMessage()
                    ];
                    Log::error('Customer distribution error', [
                        'accountNumber' => $customerData['ACCOUNT_NUMBER'],
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Data distribution completed',
                'summary' => [
                    'created' => $created,
                    'updated' => $updated,
                    'errors' => count($errors),
                    'distribution' => $distribution
                ],
                'errors' => $errors
            ]);

        } catch (\Exception $e) {
            Log::error('Distribution error', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to distribute data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get distribution summary by region and RTOM
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getDistributionSummary(Request $request)
    {
        try {
            $user = $request->user();

            $query = Customer::query();

            // Filter based on user role
            if (!$user->isSuperAdmin()) {
                if ($user->isRegionAdmin() && $user->region) {
                    $query->where('region', $user->region);
                } elseif (($user->isRtomAdmin() || $user->isSupervisor()) && $user->rtom) {
                    $query->where('rtom', $user->rtom);
                }
            }

            $summary = [
                'total' => $query->count(),
                'by_region' => $query->selectRaw('region, count(*) as count')
                    ->groupBy('region')
                    ->get(),
                'by_rtom' => $query->selectRaw('rtom, region, count(*) as count')
                    ->groupBy('rtom', 'region')
                    ->get(),
                'by_status' => $query->selectRaw('status, count(*) as count')
                    ->groupBy('status')
                    ->get(),
            ];

            return response()->json([
                'success' => true,
                'data' => $summary
            ]);

        } catch (\Exception $e) {
            Log::error('Get distribution summary error', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to get distribution summary',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
