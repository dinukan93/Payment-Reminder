import cron from 'node-cron';
import Caller from '../models/Caller.js';
import Customer from '../models/Customer.js';
import Report from '../models/Report.js';
import Request from '../models/Request.js';

// Helper to generate report for a caller (logic similar to generatePerformanceReport)
async function generateAndSaveReportForCaller(caller, reportType = 'daily') {
  const callerId = caller._id;
  const customers = await Customer.find({ assignedTo: callerId });
  const totalCustomers = customers.length;
  const completedPayments = customers.filter(c => c.status === 'COMPLETED').length;
  const pendingPayments = customers.filter(c => c.status === 'PENDING').length;
  const overdueCustomers = customers.filter(c => c.status === 'OVERDUE').length;
  let totalCalls = 0;
  let successfulCalls = 0;
  let failedCalls = 0;
  const callOutcomes = {};
  customers.forEach(customer => {
    if (customer.contactHistory && customer.contactHistory.length > 0) {
      customer.contactHistory.forEach(contact => {
        totalCalls++;
        if (contact.outcome === 'Spoke to Customer') {
          successfulCalls++;
        } else {
          failedCalls++;
        }
        callOutcomes[contact.outcome] = (callOutcomes[contact.outcome] || 0) + 1;
      });
    }
  });
  const completedRequests = await Request.find({ caller: callerId, status: 'COMPLETED' });
  const ongoingRequests = await Request.find({ caller: callerId, status: 'ACCEPTED' });
  const successRate = totalCalls > 0 ? ((successfulCalls / totalCalls) * 100).toFixed(2) : 0;
  const completionRate = totalCustomers > 0 ? ((completedPayments / totalCustomers) * 100).toFixed(2) : 0;
  const customerDetails = customers.map(customer => {
    const latestContact = customer.contactHistory && customer.contactHistory.length > 0
      ? customer.contactHistory[customer.contactHistory.length - 1]
      : null;
    return {
      taskId: customer.taskId || '',
      accountNumber: customer.accountNumber,
      name: customer.name,
      contactNumber: customer.contactNumber,
      amountOverdue: customer.amountOverdue,
      daysOverdue: customer.daysOverdue,
      status: customer.status,
      payment: customer.status === 'COMPLETED' ? 'Paid' : 'Unpaid',
      lastContactDate: latestContact?.contactDate || 'Not contacted',
      lastContactOutcome: latestContact?.outcome || 'N/A',
      lastResponse: latestContact?.remark || 'N/A',
      promisedDate: latestContact?.promisedDate || 'N/A',
      totalContacts: customer.contactHistory?.length || 0,
      responses: (customer.contactHistory || []).map(ch => ({
        date: ch.contactDate,
        outcome: ch.outcome,
        remark: ch.remark,
        promisedDate: ch.promisedDate
      }))
    };
  });
  const report = {
    reportId: `RPT-${Date.now()}`,
    reportType,
    generatedDate: new Date().toISOString(),
    caller: {
      id: caller._id,
      name: caller.name,
      callerId: caller.callerId,
      email: caller.email
    },
    summary: {
      totalCustomersAssigned: totalCustomers,
      completedPayments,
      pendingPayments,
      overdueCustomers,
      totalCalls,
      successfulCalls,
      failedCalls,
      successRate: `${successRate}%`,
      completionRate: `${completionRate}%`
    },
    callStatistics: {
      totalCalls,
      successfulCalls,
      failedCalls,
      callOutcomeBreakdown: callOutcomes
    },
    requestsCompleted: completedRequests.length,
    requestsOngoing: ongoingRequests.length,
    completedRequestsList: completedRequests.map(req => ({
      taskId: req.taskId,
      sentDate: req.sentDate,
      customersSent: req.customersSent,
      customersContacted: req.customersContacted,
      completedDate: req.updatedAt
    })),
    customerDetails: customerDetails.sort((a, b) => {
      const statusOrder = { 'COMPLETED': 0, 'PENDING': 1, 'OVERDUE': 2 };
      return statusOrder[a.status] - statusOrder[b.status];
    })
  };
  await Report.create(report);
  console.log(`[AUTO] Performance report generated and saved for ${caller.name} (${reportType})`);
}

// Schedule: 4:30pm daily
cron.schedule('30 16 * * *', async () => {
  try {
    console.log('[AUTO] Generating daily performance reports for all callers');
    const callers = await Caller.find({ role: 'caller' });
    for (const caller of callers) {
      await generateAndSaveReportForCaller(caller, 'daily');
    }
    console.log('[AUTO] All daily reports generated.');
  } catch (err) {
    console.error('[AUTO] Error generating daily reports:', err);
  }
}, {
  timezone: 'Asia/Colombo'
});