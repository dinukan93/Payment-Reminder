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
            \Illuminate\Support\Facades\DB::enableQueryLog();
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
                    // Pre-clean all keys in the row (strip BOM/non-printable chars from headers)
                    $cleanRow = [];
                    foreach ($row as $k => $v) {
                        $cleanK = preg_replace('/[\x00-\x1f\x7f-\xff]/', '', (string) $k);
                        $cleanK = trim($cleanK);
                        $cleanRow[$cleanK] = $v;
                    }
                    $row = $cleanRow;

                    if ($index === 0) {
                        \Illuminate\Support\Facades\Log::info('markPaid first row content (cleaned keys)', [
                            'keys' => array_keys($row),
                            'row' => $row
                        ]);
                    }

                    // Extract account number using proven logic from 'parse' method
                    $accountNumber = $row['ACCOUNT_NUM']
                        ?? $row['ACCOUNT_NUMBER']
                        ?? $row['Account Number']
                        ?? $row['account_number']
                        ?? $row['accountNumber']
                        ?? null;

                    // Clean and normalize account number (handle leading zeros and types)
                    if ($accountNumber !== null) {
                        // Aggressively strip BOM and non-printable characters
                        $accountNumber = preg_replace('/[\x00-\x1f\x7f-\xff]/', '', (string) $accountNumber);
                        $accountNumber = trim($accountNumber);

                        // Handle potential leading zero loss from Excel (assume 10 digits)
                        if (is_numeric($accountNumber) && strlen($accountNumber) < 10) {
                            $accountNumber = str_pad($accountNumber, 10, '0', STR_PAD_LEFT);
                        }
                    }

                    if (!$accountNumber) {
                        \Illuminate\Support\Facades\Log::warning('markPaid: No accountNumber found in row', [
                            'index' => $index,
                            'keys' => array_keys((array) $row)
                        ]);
                        $skipped++;
                        continue;
                    }

                    // Find customer in both tables with robust matching (handle trailing spaces)
                    $customer = Customer::whereRaw('TRIM(ACCOUNT_NUM) = ?', [$accountNumber])->first();
                    $filteredCustomer = FilteredCustomer::whereRaw('TRIM(ACCOUNT_NUM) = ?', [$accountNumber])->first();

                    if (!$customer && !$filteredCustomer) {
                        \Illuminate\Support\Facades\Log::warning('Customer not found for markPaid', [
                            'accountNumber' => $accountNumber,
                            'row_index' => $index,
                            'row_keys' => array_keys((array) $row)
                        ]);
                        $skipped++;
                        continue;
                    }

                    \Illuminate\Support\Facades\Log::info('markPaid customer found', [
                        'account' => $accountNumber,
                        'customer_id' => $customer->id ?? 'N/A',
                        'filtered_id' => $filteredCustomer->id ?? 'N/A'
                    ]);

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

                    // Extract arrears from Excel (handles dynamic names like NEW_ARREARS_20251122)
                    $excelArrears = $row['NEW_ARREARS']
                        ?? $row['NEW_ARREAR_S']
                        ?? $row['NEW ARREARS']
                        ?? $row['New Arrears']
                        ?? $row['new_arrears']
                        ?? null;

                    if ($excelArrears === null) {
                        // Normalize the keys to uppercase for easier lookup
                        $rowUpper = array_change_key_case((array) $row, CASE_UPPER);
                        foreach ($rowUpper as $key => $value) {
                            if (preg_match('/^NEW_ARREAR[S]?_\d{8}$/', $key)) {
                                $excelArrears = $value;
                                break;
                            }
                        }
                    }

                    // Calculate new arrears
                    \Illuminate\Support\Facades\Log::info('markPaid processing status', [
                        'account' => $accountNumber,
                        'excelArrears_raw' => $excelArrears,
                        'paymentAmount_raw' => $paymentAmount,
                        'customer_exists' => (bool) $customer,
                        'filtered_exists' => (bool) $filteredCustomer
                    ]);

                    if ($excelArrears !== null) {
                        $newArrears = floatval(str_replace(',', '', trim($excelArrears)));
                    } elseif ($paymentAmount !== null && $paymentAmount > 0) {
                        $currentArrears = floatval($customer ? $customer->NEW_ARREARS : ($filteredCustomer->NEW_ARREARS ?? 0));
                        $newArrears = max(0, $currentArrears - $paymentAmount);
                    } else {
                        // If no payment amount or new arrears specified, assume fully paid
                        $newArrears = 0;
                    }

                    \Illuminate\Support\Facades\Log::info('markPaid calculation result', [
                        'account' => $accountNumber,
                        'newArrears' => $newArrears
                    ]);

                    // Standardize status for both tables as 'completed' as requested by user
                    $newStatus = 'completed';

                    // Age months logic: if completed, age is 0
                    $newAgeMonths = 0;

                    // Update Customer record if it exists (only update Arrears if status column is missing)
                    if ($customer) {
                        $customer->update([
                            'NEW_ARREARS' => $newArrears
                        ]);
                    }

                    // Update FilteredCustomer record if it exists (has status column)
                    if ($filteredCustomer) {
                        $filteredCustomer->update([
                            'status' => $newStatus, // filtered_customers uses lowercase
                            'NEW_ARREARS' => $newArrears,
                            'AGE_MONTHS' => $newAgeMonths
                        ]);
                    }

                    \Illuminate\Support\Facades\Log::info('markPaid update confirmed', [
                        'account' => $accountNumber,
                        'new_arrears' => $newArrears,
                        'status' => $newStatus
                    ]);

                    $markedPaid++;

                } catch (\Exception $e) {
                    $errors[] = [
                        'accountNumber' => $accountNumber ?? 'unknown',
                        'error' => $e->getMessage()
                    ];
                }
            }

            \Illuminate\Support\Facades\Log::info('markPaid completed queries', [
                'queries' => \Illuminate\Support\Facades\DB::getQueryLog()
            ]);

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
