<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FilteredCustomer extends Model
{
    public $timestamps = false;

    protected $fillable = [
        // Essential Excel columns for caller work
        'REGION',
        'RTOM',
        'ACCOUNT_NUM',
        'PRODUCT_LABEL',
        'MEDIUM',
        'CUSTOMER_NAME',
        'LATEST_BILL_MNY',
        'NEW_ARREARS',
        'CREDIT_SCORE',
        'ACCOUNT_MANAGER',
        'BILL_HANDLING_CODE_NAME',
        'MOBILE_CONTACT_TEL',
        'EMAIL_ADDRESS',
        'NEXT_BILL_DATE',
        'AGE_MONTHS',
        'SALES_PERSON',
        'CREDIT_CLASS_NAME',
        'REMARK',
        // Caller working columns
        'CONTACT_DATE',
        'CRM_ACTION',
        'RETRY_COUNT',
        'CUSTOMER_FEEDBACK',
        'CREDIT_ACTION',
        'MOBILE_NO_CONFIRMATION',
        // System columns
        'status',
        'assigned_to',
        'assignment_type'
    ];

    protected $casts = [
        'LATEST_BILL_MNY' => 'decimal:2',
        'NEW_ARREARS' => 'decimal:2',
        'AGE_MONTHS' => 'integer',
        'CONTACT_DATE' => 'date',
        'RETRY_COUNT' => 'integer',
    ];

    /**
     * Get the caller assigned to this customer
     */
    public function assignedCaller()
    {
        return $this->belongsTo(Caller::class, 'assigned_to');
    }

    /**
     * Get the contact history for this customer
     */
    public function contactHistory()
    {
        return $this->hasMany(ContactHistory::class, 'customer_id');
    }
}

