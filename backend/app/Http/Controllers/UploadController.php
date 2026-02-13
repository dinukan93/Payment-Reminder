<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Customer;
use App\Models\FilteredCustomer;
use Rap2hpoutre\FastExcel\FastExcel;

class UploadController extends Controller
{
    public function parse(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv'
        ]);

        $file = $request->file('file');
        $data = (new FastExcel)->import($file);

        if ($data->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'The uploaded file is empty.'
            ], 422);
        }

        // Get original headers for the preview
        $firstRow = $data->first();
        $headers = array_keys($firstRow);

        return response()->json([
            'success' => true,
            'data' => [
                'headers' => $headers,
                'rows' => $data->toArray(),
                'totalRows' => count($data),
                'fileName' => $file->getClientOriginalName()
            ]
        ]);
    }

    public function import(Request $request)
    {
        $request->validate([
            'customers' => 'required|array'
        ]);

        $imported = 0;
        $errors = [];

        foreach ($request->customers as $customerData) {
            try {
                // Check if customer already exists
                $existing = Customer::where('accountNumber', $customerData['accountNumber'])->first();

                if ($existing) {
                    // Update existing customer
                    $existing->update($customerData);
                } else {
                    // Create new customer
                    Customer::create(array_merge($customerData, ['status' => 'overdue']));
                }

                $imported++;
            } catch (\Exception $e) {
                $errors[] = [
                    'accountNumber' => $customerData['accountNumber'],
                    'error' => $e->getMessage()
                ];
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Imported {$imported} customers",
            'imported' => $imported,
            'errors' => $errors
        ]);
    }

    public function markPaid(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv'
        ]);

        try {
            $file = $request->file('file');
            $data = (new FastExcel)->import($file);

            \Log::info('markPaid import complete', [
                'row_count' => count($data),
                'file_name' => $file->getClientOriginalName()
            ]);

            $markedPaid = 0;
            $updated = 0;
            $skipped = 0;
            $errors = [];

            foreach ($data as $index => $row) {
                try {
                    // Extract account number using proven logic from 'parse' method
                    $accountNumber = $row['ACCOUNT_NUM']
                        ?? $row['ACCOUNT_NUMBER']
                        ?? $row['Account Number']
                        ?? $row['account_number']
                        ?? $row['accountNumber']
                        ?? null;

                    // Clean and normalize account number (handle leading zeros and types)
                    if ($accountNumber !== null) {
                        $accountNumber = trim((string) $accountNumber);

                        // Handle potential leading zero loss from Excel (assume 10 digits)
                        if (is_numeric($accountNumber) && strlen($accountNumber) < 10) {
                            $accountNumber = str_pad($accountNumber, 10, '0', STR_PAD_LEFT);
                        }
                    }

                    if ($accountNumber === '0038630092') {
                        \Illuminate\Support\Facades\Log::info('DEBUG: Found target account in markPaid row', [
                            'original_account' => $row['ACCOUNT_NUM'] ?? 'N/A',
                            'normalized_account' => $accountNumber,
                            'row_keys' => array_keys((array) $row)
                        ]);
                    }

                    if (!$accountNumber) {
                        $skipped++;
                        continue;
                    }

                    // Find customer in both tables
                    $customer = Customer::where('ACCOUNT_NUM', $accountNumber)->first();
                    $filteredCustomer = FilteredCustomer::where('ACCOUNT_NUM', $accountNumber)->first();

                    if (!$customer && !$filteredCustomer) {
                        \Illuminate\Support\Facades\Log::warning('Customer not found for markPaid', [
                            'accountNumber' => $accountNumber,
                            'row_index' => $index,
                            'row_keys' => array_keys((array) $row)
                        ]);
                        $skipped++;
                        continue;
                    }

                    // Extract payment amount using direct row access
                    $paymentAmount = $row['PAYMENT_AMOUNT']
                        ?? $row['PAYMENT AMOUNT']
                        ?? $row['AMOUNT_PAID']
                        ?? $row['AMOUNT PAID']
                        ?? $row['PAID_AMOUNT']
                        ?? $row['PAID AMOUNT']
                        ?? $row['Payment Amount']
                        ?? $row['Amount Paid']
                        ?? $row['Paid Amount']
                        ?? null;

                    // Clean and convert payment amount
                    if ($paymentAmount !== null) {
                        $paymentAmount = floatval(str_replace(',', '', trim($paymentAmount)));
                    }

                    // Extract arrears from Excel (user mentioned NEW_ARREARS is in the file)
                    $excelArrears = $row['NEW_ARREARS']
                        ?? $row['NEW_ARREAR_S']
                        ?? $row['NEW ARREARS']
                        ?? $row['New Arrears']
                        ?? $row['new_arrears']
                        ?? null;

                    // Calculate new arrears
                    if ($excelArrears !== null) {
                        $newArrears = floatval(str_replace(',', '', trim($excelArrears)));
                    } elseif ($paymentAmount !== null && $paymentAmount > 0) {
                        $currentArrears = floatval($customer ? $customer->NEW_ARREARS : ($filteredCustomer->NEW_ARREARS ?? 0));
                        $newArrears = max(0, $currentArrears - $paymentAmount);
                    } else {
                        // If no payment amount or new arrears specified, assume fully paid
                        $newArrears = 0;
                    }

                    // Determine status based on remaining arrears
                    $newStatus = $newArrears <= 0 ? 'COMPLETED' : 'pending';

                    // Safely get AGE_MONTHS from whichever record exists
                    $currentAgeMonths = $customer->AGE_MONTHS ?? $filteredCustomer->AGE_MONTHS ?? 0;
                    $newAgeMonths = $newArrears <= 0 ? 0 : $currentAgeMonths;

                    // Update Customer record if it exists
                    if ($customer) {
                        $customer->update([
                            'status' => $newStatus,
                            'NEW_ARREARS' => $newArrears,
                            'AGE_MONTHS' => $newAgeMonths
                        ]);
                    }

                    // Update FilteredCustomer record if it exists
                    if ($filteredCustomer) {
                        $filteredCustomer->update([
                            'status' => strtolower($newStatus) === 'completed' ? 'paid' : $newStatus,
                            'NEW_ARREARS' => $newArrears,
                            'AGE_MONTHS' => $newAgeMonths
                        ]);
                    }

                    if ($newArrears <= 0) {
                        $markedPaid++;
                    } else {
                        $updated++;
                    }

                } catch (\Exception $e) {
                    $errors[] = [
                        'accountNumber' => $accountNumber ?? 'unknown',
                        'error' => $e->getMessage()
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'message' => "Processed {$markedPaid} fully paid customers and {$updated} partial payments",
                'data' => [
                    'marked' => $markedPaid,
                    'updated' => $updated,
                    'skipped' => $skipped,
                    'errors' => count($errors)
                ],
                'errors' => $errors
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to process paid customers file',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
