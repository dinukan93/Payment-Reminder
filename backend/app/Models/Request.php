<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Request extends Model
{
    protected $fillable = [
        'task_id',
        'caller_id',
        'caller_name',
        'customers_sent',
        'contacted',
        'sent_date',
        'status',
        'customer_ids',
        'sent_by'
    ];

    protected $casts = [
        'customers_sent' => 'integer',
        'contacted' => 'integer',
        'sent_date' => 'datetime',
        'status' => 'string',
        'customer_ids' => 'array'
    ];

    // Relationship: Request belongs to caller
    public function caller()
    {
        return $this->belongsTo(Caller::class, 'caller_id');
    }

    // Check if request is pending
    public function isPending()
    {
        return $this->status === 'PENDING';
    }

    // Check if request is accepted
    public function isAccepted()
    {
        return $this->status === 'ACCEPTED';
    }

    // Check if request is declined
    public function isDeclined()
    {
        return $this->status === 'DECLINED';
    }
}
