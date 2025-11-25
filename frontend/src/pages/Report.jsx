import React from 'react'
import "../components/SearchBar.css";
import "./Report.css";
import { LuPhoneCall } from "react-icons/lu";
import { MdVerified } from "react-icons/md";
import { BsCashCoin } from "react-icons/bs";
import { IoIosWarning } from "react-icons/io";
import CallerStatisticsTable from '../components/CallerStatisticsTable';

function Report() {
  return (
    <>
        <div className="title">Report</div>
            <hr />
        <div className="widgets">
            <div className="total-calls">
                <h4>Total Calls</h4>
                <h3>1100</h3>
                <LuPhoneCall className='totalCall-icon' />
            </div>
            <div className="sucessful-calls">
                <h4>Sucessful Calls</h4>
                <h3>970</h3>
                <MdVerified className='verified-icon' />
            </div>
            <div className="total-payments">
                <h4>Total Payments</h4>
                <h3>835</h3>
                <BsCashCoin className='totalpay-icon' />
            </div>
            <div className="pending-payments">
                <h4>Pending Payments</h4>
                <h3>132</h3>
                <IoIosWarning className='pending-icon' />
            </div>
        </div>
        <div className='caller-statistics'>
            {/* <div className="chart-title">Detailed Caller Statistics</div> */}
            <CallerStatisticsTable />
        </div>

        <div className='download-section'>
            <select name="reportType" className='report-type'>
                <option>Daily Report</option>
                <option>Weekly Report</option>
                <option>Monthly Report</option>
            </select>
            <button className='download-pdf'>PDF</button>
            <button className='download-excel'>Excel</button>
        </div>
    </>
  )
}

export default Report