<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CheckAssignmentTypes extends Command
{
    protected $signature = 'customers:check-assignments';
    protected $description = 'Check assignment_type distribution in filtered_customers table';

    public function handle()
    {
        $total = DB::table('filtered_customers')->count();
        $withAssignment = DB::table('filtered_customers')->whereNotNull('assignment_type')->count();
        $withoutAssignment = DB::table('filtered_customers')->whereNull('assignment_type')->count();

        $this->info("Total filtered customers: {$total}");
        $this->info("With assignment_type: {$withAssignment}");
        $this->info("Without assignment_type: {$withoutAssignment}");
        $this->newLine();

        $this->info("Assignment Type Distribution:");
        $this->line(str_repeat('-', 60));

        $results = DB::table('filtered_customers')
            ->select('assignment_type', DB::raw('COUNT(*) as count'))
            ->groupBy('assignment_type')
            ->orderByDesc('count')
            ->get();

        foreach ($results as $result) {
            $type = $result->assignment_type ?? 'NULL';
            $count = $result->count;
            $this->line(sprintf("%-40s: %d", $type, $count));
        }

        $this->newLine();

        // Show sample records
        $this->info("Sample Records:");
        $samples = DB::table('filtered_customers')
            ->select('ACCOUNT_NUM', 'CUSTOMER_NAME', 'assignment_type', 'REGION', 'RTOM')
            ->limit(10)
            ->get();

        $this->table(
            ['Account', 'Customer', 'Assignment Type', 'Region', 'RTOM'],
            $samples->map(fn($s) => [
                $s->ACCOUNT_NUM,
                substr($s->CUSTOMER_NAME ?? '', 0, 20),
                $s->assignment_type ?? 'NULL',
                $s->REGION ?? '',
                $s->RTOM ?? ''
            ])
        );

        return 0;
    }
}
