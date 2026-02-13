<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Caller;
use App\Models\PerformanceReport;
use Illuminate\Support\Facades\Log;

class ReportController extends Controller
{
    /**
     * Submit a performance report from a caller
     * 
     * @param Request $request
     * @param int $id - Caller ID
     * @return \Illuminate\Http\JsonResponse
     */
    public function submitReport(Request $request, $id)
    {
        try {
            // Validate the caller exists
            $caller = Caller::findOrFail($id);

            // Validate incoming data
            $validated = $request->validate([
                'reportType' => 'required|in:daily,weekly,monthly',
                'stats' => 'required|array',
                'stats.totalCalls' => 'required|integer|min:0',
                'stats.successfulCalls' => 'required|integer|min:0',
                'stats.totalPayments' => 'required|integer|min:0',
                'stats.pendingPayments' => 'required|integer|min:0',
                'stats.successRate' => 'required|numeric|min:0|max:100',
                'stats.completionRate' => 'required|numeric|min:0|max:100',
                'customerDetails' => 'required|array'
            ]);

            // Generate unique report ID
            $reportId = $this->generateReportId();

            // Store the report in the database
            $report = PerformanceReport::create([
                'report_id' => $reportId,
                'caller_id' => $caller->id,
                'report_type' => $validated['reportType'],
                'stats' => $validated['stats'],
                'customer_details' => $validated['customerDetails'],
                'generated_date' => now()
            ]);

            // Log the report submission (summary only)
            Log::info('Performance Report Submitted', [
                'report_id' => $reportId,
                'caller_id' => $caller->callerId,
                'report_type' => $validated['reportType'],
                'customer_count' => count($validated['customerDetails']),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Report submitted successfully',
                'data' => [
                    'reportId' => $reportId,
                    'submittedAt' => now()->toDateTimeString(),
                    'callerName' => $caller->name,
                    'reportType' => $validated['reportType']
                ]
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Caller not found'
            ], 404);

        } catch (\Exception $e) {
            Log::error('Error submitting report', [
                'caller_id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error submitting report: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all performance reports
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        try {
            $query = PerformanceReport::with('caller');

            // Filter by caller ID if provided
            if ($request->has('callerId')) {
                $query->where('caller_id', $request->callerId);
            }

            // Filter by report type if provided
            if ($request->has('reportType')) {
                $query->where('report_type', $request->reportType);
            }

            // Filter by date range if provided
            if ($request->has('startDate')) {
                $query->where('generated_date', '>=', $request->startDate);
            }
            if ($request->has('endDate')) {
                $query->where('generated_date', '<=', $request->endDate);
            }

            // Get reports ordered by most recent first
            $reports = $query->orderBy('generated_date', 'desc')->get();

            // Transform the data for frontend
            $transformedReports = $reports->map(function ($report) {
                return [
                    '_id' => $report->id,
                    'reportId' => $report->report_id,
                    'caller' => [
                        '_id' => $report->caller->id,
                        'callerId' => $report->caller->callerId,
                        'name' => $report->caller->name
                    ],
                    'reportType' => $report->report_type,
                    'stats' => $report->stats,
                    'customerDetails' => $report->customer_details,
                    'generatedDate' => $report->generated_date->toISOString()
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $transformedReports
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error fetching reports: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error fetching reports: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate a unique report ID
     * Format: RPT-YYYYMMDD-XXX
     * 
     * @return string
     */
    private function generateReportId()
    {
        $date = now()->format('Ymd');
        $random = str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT);
        return "RPT-{$date}-{$random}";
    }
}
