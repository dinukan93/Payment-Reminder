<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    public $timestamps = false;

    protected $fillable = [
        // Excel columns - exact names
        'RUN_DATE',
        'REGION',
        'RTOM',
        'CUSTOMER_REF',
        'ACCOUNT_NUM',
        'PRODUCT_LABEL',
        'MEDIUM',
        'CUSTOMER_SEGMENT',
        'ADDRESS_NAME',
        'FULL_ADDRESS',
        'LATEST_BILL_MNY',
        'NEW_ARREARS',
        'MOBILE_CONTACT_TEL',
        'EMAIL_ADDRESS',
        'CREDIT_SCORE',
        'CREDIT_CLASS_NAME',
        'BILL_HANDLING_CODE_NAME',
        'AGE_MONTHS',
        'SALES_PERSON',
        'ACCOUNT_MANAGER',
        'SLT_GL_SUB_SEGMENT',
        'BILLING_CENTRE',
        'PROVINCE',
        'NEXT_BILL_DTM',
        'BILL_MONTH',
        'LATEST_BILL_DTM',
        'INVOICING_CO_ID',
        'INVOICING_CO_NAME',
        'PRODUCT_SEQ',
        'PRODUCT_ID',
        'LATEST_PRODUCT_STATUS',
        'BILL_HANDLING_CODE',
        'SLT_BUSINESS_LINE_VALUE',
        'SALES_CHANNEL',
        // System fields
        'status'
    ];

    protected $casts = [
        'RUN_DATE' => 'date',
        'LATEST_BILL_MNY' => 'decimal:2',
        'NEW_ARREARS' => 'decimal:2',
        'AGE_MONTHS' => 'integer',
    ];

    // Relationship: Customer assigned to caller
    public function caller()
    {
        return $this->belongsTo(Caller::class, 'assigned_to');
    }

    // Relationship: Customer has many contact history records
    public function contactHistory()
    {
        return $this->hasMany(ContactHistory::class, 'customer_id')->orderBy('contact_date', 'desc');
    }

    // Get latest contact
    public function latestContact()
    {
        return $this->contactHistory()->latest('contact_date')->first();
    }
}
