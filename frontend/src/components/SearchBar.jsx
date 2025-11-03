import React from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./searchBar.css";

function SearchBar() {
  return (
    <div className="searchbar">
      <input type="text" placeholder="Search customer..." />
      <select name="payType">
        <option>All payments</option>
        <option>Pending</option>
        <option>Failed</option>
      </select>
      <button className="search-icon">
        <i class="bi bi-search"></i>
      </button>
      <button className="add-button">
        <i class="bi bi-person-add"></i>
        Add
      </button>
    </div>
  );
}

export default SearchBar;
