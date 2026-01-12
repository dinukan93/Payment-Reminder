import React, { useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./SearchBar.css";

function SearchBar({ onAddClick, onSearch, onFilterChange, searchPlaceholder = "Search customer..." }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleFilterChange = (e) => {
    const value = e.target.value;
    setFilterType(value);
    if (onFilterChange) {
      onFilterChange(value);
    }
  };

  const handleSearchClick = () => {
    if (onSearch) {
      onSearch(searchTerm);
    }
  };

  return (
    <div className="searchbar">
      <input 
        type="text" 
        placeholder={searchPlaceholder}
        value={searchTerm}
        onChange={handleSearchChange}
      />
      <select name="filterType" value={filterType} onChange={handleFilterChange}>
        <option>All</option>
        <option>Pending</option>
        <option>Active</option>
        <option>Inactive</option>
        <option>Completed</option>
      </select>
      <button className="search-icon" onClick={handleSearchClick}>
        <i className="bi bi-search"></i>
      </button>
      <button className="add-button" onClick={onAddClick}>
        <i className="bi bi-person-add"></i>
        Add
      </button>
    </div>
  );
}

export default SearchBar;
