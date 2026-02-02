<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Customer;
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

        $parsed = $data->map(function ($row) {
            return [
                'accountNumber' => $row['Account Number'] ?? $row['accountNumber'] ?? null,
                'name' => $row['Name'] ?? $row['name'] ?? null,
                'contactPerson' => $row['Contact Person'] ?? $row['contactPerson'] ?? null,
                'contactPersonPhone' => $row['Contact Person Phone'] ?? $row['contactPersonPhone'] ?? null,
                'phone' => $row['Phone'] ?? $row['phone'] ?? null,
                'region' => $row['Region'] ?? $row['region'] ?? null,
                'rtom' => $row['RTOM'] ?? $row['rtom'] ?? null,
                'address' => $row['Address'] ?? $row['address'] ?? null,
                'amountOverdue' => $row['Amount Overdue'] ?? $row['amountOverdue'] ?? 0,
                'daysOverdue' => $row['Days Overdue'] ?? $row['daysOverdue'] ?? 0
            ];
        })->toArray();

        return response()->json(['data' => $parsed]);
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

            $markedPaid = 0;
            $updated = 0;
            $skipped = 0;
            $errors = [];

            foreach ($data as $row) {
                try {
                    // Extract account number from various possible column names
                    $accountNumber = $row['Account Number']
                        ?? $row['ACCOUNT_NUMBER']
                        ?? $row['ACCOUNT_NUM']
                        ?? $row['accountNumber']
                        ?? null;

                    if (!$accountNumber) {
                        $skipped++;
                        continue;
                    }

                    // Find customer by account number (using ACCOUNT_NUM which is the actual DB column)
                    $customer = Customer::where('ACCOUNT_NUM', $accountNumber)->first();

                    if (!$customer) {
                        $skipped++;
                        continue;
                    }

                    // Extract payment amount from various possible column names
                    $paymentAmount = $row['Payment Amount']
                        ?? $row['PAYMENT_AMOUNT']
                        ?? $row['Amount Paid']
                        ?? $row['AMOUNT_PAID']
                        ?? $row['Paid Amount']
                        ?? null;

                    // Clean and convert payment amount
                    if ($paymentAmount !== null) {
                        $paymentAmount = floatval(str_replace(',', '', trim($paymentAmount)));
                    }

                    // Get current arrears
                    $currentArrears = floatval($customer->NEW_ARREARS ?? 0);

                    // Calculate new arrears
                    if ($paymentAmount !== null && $paymentAmount > 0) {
                        $newArrears = max(0, $currentArrears - $paymentAmount);
                    } else {
                        // If no payment amount specified, assume fully paid
                        $newArrears = 0;
                    }

                    // Determine status based on remaining arrears
                    $newStatus = $newArrears <= 0 ? 'COMPLETED' : 'pending';
                    $newAgeMonths = $newArrears <= 0 ? 0 : $customer->AGE_MONTHS;

                    // Update customer
                    $customer->update([
                        'status' => $newStatus,
                        'NEW_ARREARS' => $newArrears,
                        'AGE_MONTHS' => $newAgeMonths
                    ]);

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
