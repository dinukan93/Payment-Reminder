<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PerformanceReport extends Model
{
    protected $fillable = [
        'report_id',
        'caller_id',
        'report_type',
        'stats',
        'customer_details',
        'generated_date'
    ];

    protected $casts = [
        'stats' => 'array',
        'customer_details' => 'array',
        'generated_date' => 'datetime'
    ];

    /**
     * Get the caller who submitted this report
     */
    public function caller()
    {
        return $this->belongsTo(Caller::class, 'caller_id');
    }
}
