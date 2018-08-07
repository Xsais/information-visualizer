/**
 * File: header.js
 * Assignment: Final Project
 * Creation date: August 6, 2018
 * Last Modified: August 6, 2018
 * Description: Handles the functionality of the header on each page
 *
 * GitHub Link: https://github.com/Xsais/information-visualizer/blob/master/res/js/header.js
 *
 * Group Members:
 *    - James Grau
 *    - Bhavay Grover
 *    - Nathaniel PrimoS
 */

$(function() {

    // Removes JQuery Mobile styling
    $("div[data-role='header']").find("*[data-role='none']").removeAttr("class")

    // Allows user to navigate pages
    $("div[data-role='header'] a[data-folder]").on("click", function () {

        window.location.href = `../${$(this).attr("data-folder")}/index.html`;
    });
})