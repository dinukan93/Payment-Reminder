<?php

namespace App\Http\Controllers;

use App\Models\ExcelUploadHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class ExcelUploadHistoryController extends Controller
{
    /**
     * Get list of uploaded Excel files
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->get('per_page', 10);

            $uploads = ExcelUploadHistory::with('uploadedBy:id,name,email')
                ->orderBy('created_at', 'desc')
                ->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $uploads
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching Excel upload history', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch upload history',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get details of a specific upload
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        try {
            $upload = ExcelUploadHistory::with('uploadedBy:id,name,email')->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $upload
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Upload not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Download a previously uploaded Excel file
     *
     * @param int $id
     * @return \Symfony\Component\HttpFoundation\BinaryFileResponse|\Illuminate\Http\JsonResponse
     */
    public function download($id)
    {
        try {
            $upload = ExcelUploadHistory::findOrFail($id);

            if (!file_exists($upload->file_path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'File not found on server'
                ], 404);
            }

            return response()->download($upload->file_path, $upload->original_filename);
        } catch (\Exception $e) {
            Log::error('Error downloading file', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to download file',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete an upload record and its file
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        try {
            $upload = ExcelUploadHistory::findOrFail($id);

            // Delete the physical file if it exists
            if (file_exists($upload->file_path)) {
                unlink($upload->file_path);
            }

            // Delete the database record
            $upload->delete();

            Log::info('Excel upload deleted', ['id' => $id, 'filename' => $upload->original_filename]);

            return response()->json([
                'success' => true,
                'message' => 'Upload deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting upload', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete upload',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get the latest uploaded Excel file
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function latest()
    {
        try {
            $latest = ExcelUploadHistory::with('uploadedBy:id,name,email')
                ->orderBy('created_at', 'desc')
                ->first();

            if (!$latest) {
                return response()->json([
                    'success' => false,
                    'message' => 'No uploads found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $latest
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch latest upload',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
