<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CleanCustomerData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'customers:clean {--force : Force the operation without confirmation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean all data from customers and filtered_customers tables';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Get current counts
        $customersCount = DB::table('customers')->count();
        $filteredCustomersCount = DB::table('filtered_customers')->count();

        $this->info("Current data:");
        $this->line("  - customers: {$customersCount} records");
        $this->line("  - filtered_customers: {$filteredCustomersCount} records");
        $this->newLine();

        // Confirm unless --force is used
        if (!$this->option('force')) {
            if (!$this->confirm('Are you sure you want to delete all data from these tables?')) {
                $this->info('Operation cancelled.');
                return 0;
            }
        }

        try {
            // Disable foreign key checks
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');

            // Truncate tables
            DB::table('filtered_customers')->truncate();
            $this->info('✓ Cleaned filtered_customers table');

            DB::table('customers')->truncate();
            $this->info('✓ Cleaned customers table');

            // Re-enable foreign key checks
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');

            $this->newLine();
            $this->info('All customer data has been successfully cleaned!');

            return 0;
        } catch (\Exception $e) {
            // Make sure to re-enable foreign key checks even if there's an error
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            $this->error('Error cleaning tables: ' . $e->getMessage());
            return 1;
        }
    }
}
