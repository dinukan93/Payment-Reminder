import React, { useState, useEffect } from "react";
import "./PaymentCalendar.css";
import logger from '../utils/logger';
import "bootstrap-icons/font/bootstrap-icons.css";

function PaymentCalendar({ isOpen, onClose, promisedPayments = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDateCustomers, setSelectedDateCustomers] = useState([]);

  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day} /${month}/${year} `;
  };

  // Initialize calendar with today's date when it opens
  useEffect(() => {
    if (isOpen) {
      setSelectedDate(new Date());
    }
  }, [isOpen]);

  useEffect(() => {
    logger.info('PaymentCalendar - Promised payments:', promisedPayments);
    // Find customers with promised dates matching current view
  }, [promisedPayments]);

  // Update selected date customers whenever data or selected date changes
  useEffect(() => {
    const dateString = formatDate(selectedDate);
    logger.info('Calendar: Looking for payments on', dateString);
    logger.info('Calendar: Total promisedPayments:', promisedPayments.length);
    logger.info('Calendar: All promisedPayments:', promisedPayments);

    const customers = promisedPayments.filter(
      (payment) => {
        logger.debug('  Comparing:', payment.promisedDate, '===', dateString, '?', payment.promisedDate === dateString);
        return payment.promisedDate === dateString;
      }
    );

    logger.info('📅 Calendar: Found', customers.length, 'customers for', dateString);
    setSelectedDateCustomers(customers);
  }, [JSON.stringify(promisedPayments), selectedDate]);

  const updateSelectedDateCustomers = (date) => {
    setSelectedDate(date);
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const getPaymentCountForDate = (date) => {
    const dateString = formatDate(date);
    return (promisedPayments || []).filter((p) => p.promisedDate === dateString)
      .length;
  };

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const handleDateClick = (day) => {
    const clickedDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    updateSelectedDateCustomers(clickedDate);
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const isSelectedDate = (day) => {
    return (
      day === selectedDate.getDate() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear()
    );
  };

  if (!isOpen) return null;

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const year = currentDate.getFullYear();

  return (
    <div className="calendar-overlay" onClick={onClose}>
      <div className="calendar-modal" onClick={(e) => e.stopPropagation()}>
        <div className="calendar-header">
          <h3>Payment Schedule</h3>
          <button className="calendar-close" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="calendar-body">
          <div className="calendar-left">
            <div className="calendar-navigation">
              <button onClick={handlePrevMonth}>
                <i className="bi bi-chevron-left"></i>
              </button>
              <span className="calendar-month-year">
                {monthName} {year}
              </span>
              <button onClick={handleNextMonth}>
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>

            <div className="calendar-grid">
              <div className="calendar-weekdays">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              <div className="calendar-days">
                {Array.from({ length: startingDayOfWeek }).map((_, index) => (
                  <div
                    key={`empty - ${index} `}
                    className="calendar-day empty"
                  ></div>
                ))}

                {Array.from({ length: daysInMonth }).map((_, index) => {
                  const day = index + 1;
                  const date = new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth(),
                    day
                  );
                  const paymentCount = getPaymentCountForDate(date);

                  return (
                    <div
                      key={day}
                      className={`calendar - day ${isToday(day) ? "today" : ""} ${isSelectedDate(day) ? "selected" : ""
                        } ${paymentCount > 0 ? "has-payments" : ""} `}
                      onClick={() => handleDateClick(day)}
                    >
                      <span className="day-number">{day}</span>
                      {paymentCount > 0 && (
                        <span className="payment-badge">{paymentCount}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="calendar-right">
            <div className="calendar-customers">
              <h4>
                Payments Due on {formatDate(selectedDate)}
                {selectedDateCustomers.length > 0 && (
                  <span className="count-badge">
                    {selectedDateCustomers.length}
                  </span>
                )}
              </h4>
              {selectedDateCustomers.length > 0 ? (
                <div className="customer-list">
                  {selectedDateCustomers.map((customer, index) => (
                    <div key={index} className="customer-item">
                      <div className="customer-details">
                        <div>
                          <strong>{customer.name}</strong>
                          <div className="account-number-small">
                            Account: {customer.accountNumber}
                          </div>
                        </div>
                        <span className="customer-amount">
                          {customer.amountOverdue}
                        </span>
                      </div>
                      <div className="customer-contact">
                        <i className="bi bi-telephone"></i>
                        {customer.contactNumber}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-customers">
                  <i className="bi bi-calendar-check"></i>
                  <p>No payments scheduled for this date</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentCalendar;
