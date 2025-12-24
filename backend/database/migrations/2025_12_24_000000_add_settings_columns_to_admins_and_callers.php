<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add settings columns to admins table
        Schema::table('admins', function (Blueprint $table) {
            if (!Schema::hasColumn('admins', 'avatar')) {
                $table->longText('avatar')->nullable()->after('phone');
            }
            if (!Schema::hasColumn('admins', 'email_notifications')) {
                $table->boolean('email_notifications')->default(false)->after('avatar');
            }
            if (!Schema::hasColumn('admins', 'payment_reminder')) {
                $table->boolean('payment_reminder')->default(false)->after('email_notifications');
            }
            if (!Schema::hasColumn('admins', 'call_notifications')) {
                $table->boolean('call_notifications')->default(false)->after('payment_reminder');
            }
            if (!Schema::hasColumn('admins', 'language')) {
                $table->string('language')->default('English')->after('call_notifications');
            }
            if (!Schema::hasColumn('admins', 'timezone')) {
                $table->string('timezone')->default('UTC')->after('language');
            }
        });

        // Add settings columns to callers table
        Schema::table('callers', function (Blueprint $table) {
            if (!Schema::hasColumn('callers', 'avatar')) {
                $table->longText('avatar')->nullable()->after('phone');
            }
            if (!Schema::hasColumn('callers', 'email_notifications')) {
                $table->boolean('email_notifications')->default(false)->after('avatar');
            }
            if (!Schema::hasColumn('callers', 'payment_reminder')) {
                $table->boolean('payment_reminder')->default(false)->after('email_notifications');
            }
            if (!Schema::hasColumn('callers', 'call_notifications')) {
                $table->boolean('call_notifications')->default(false)->after('payment_reminder');
            }
            if (!Schema::hasColumn('callers', 'language')) {
                $table->string('language')->default('English')->after('call_notifications');
            }
            if (!Schema::hasColumn('callers', 'timezone')) {
                $table->string('timezone')->default('UTC')->after('language');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('admins', function (Blueprint $table) {
            $table->dropColumn(['avatar', 'email_notifications', 'payment_reminder', 'call_notifications', 'language', 'timezone']);
        });

        Schema::table('callers', function (Blueprint $table) {
            $table->dropColumn(['avatar', 'email_notifications', 'payment_reminder', 'call_notifications', 'language', 'timezone']);
        });
    }
};
