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
            'customers' => 'required|array'
        ]);

        $updated = 0;

        foreach ($request->customers as $customerData) {
            $customer = Customer::where('accountNumber', $customerData['accountNumber'])->first();

            if ($customer) {
                $customer->update([
                    'status' => 'COMPLETED',
                    'NEW_ARREARS' => 0,
                    'AGE_MONTHS' => 0
                ]);
                $updated++;
            }
        }

        return response()->json([
            'message' => "Marked {$updated} customers as paid",
            'updated' => $updated
        ]);
    }
}
