import React, { useState } from "react";
import "./OverduePaymentsTable.css";
import ShowCustomerDetailsModal from "./ShowCustomerDetailsModal";

function OverduePaymentsTable({ payments, onSaveDetails }) {
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleShowDetails = (payment) => {
    setSelectedPayment(payment);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPayment(null);
  };

  const handleSave = (data) => {
    if (onSaveDetails && selectedPayment) {
      onSaveDetails(selectedPayment.id, data);
    }
    handleCloseModal();
  };

  return (
    <>
      <div className="overdue-payments-section">
        <div className="section-header">
          <h3>Overdue Payments</h3>
          <a href="#" className="see-all">See All</a>
        </div>
        <div className="table-container">
          <table className="overdue-table">
            <thead>
              <tr>
                <th>CUSTOMER NAME & OVERDUE PAYMENT DATE</th>
                <th>PAYMENT STATUS</th>
                <th>LATEST RESPONSE</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment, index) => (
                <tr key={index}>
                  <td>
                    <div className="customer-info">
                      <strong>{payment.name}</strong>
                      <span className="account-number">Account Number: {payment.accountNumber}</span>
                      <span className="date">{payment.date}</span>
                    </div>
                  </td>
                  <td>
                    <span className="status-badge overdue">
                      {payment.status}
                    </span>
                  </td>
                  <td className="response-text">{payment.response}</td>
                  <td>
                    <button 
                      className="action-button"
                      onClick={() => handleShowDetails(payment)}
                    >
                      SHOW DETAILS
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ShowCustomerDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        customer={selectedPayment}
        onSave={handleSave}
      />
    </>
  );
}

export default OverduePaymentsTable;
