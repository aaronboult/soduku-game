let focusedCellID, 
    livesEnabled, 
    highlightingEnabled, 
    allowMultipleSolutions, 
    startTime;

const puzzle = {
    "grid": null,
    "solutions": null
};

$(function(){

    generateGrid();

    $(window).click(function(event){

        clearHighlight();
        
        if (focusedCellID){

            clearSelectedCell();

        }

    });

});

/**
 * Clear any grid and generated a new 9x9 grid of cells
 */
function generateGrid(){

    $("#soduku-grid").html("");

    for (let block = 0 ; block < 9 ; block++){

        $("#soduku-grid").append(
            `<div style="grid-area: Block${block};" class="soduku-block" id="Block${block}">
            </div>`
        );

        for (let cell = 0 ; cell < 9 ; cell++){

            const yCoordinate = (
                Math.floor(block / 3) * 3
            ) + Math.floor(cell / 3);

            const xCoordinate = (block % 3) * 3 + (cell % 3);

            $(`#Block${block}`).append(
                `<div style="grid-area: Cell${cell};" id="Cell-${yCoordinate}-${xCoordinate}" enteredValue='-1' tempValue='-1'>
                </div>`
            );

        }

    }

}

/**
 * Handles the initial generation of the puzzle and the assigning of event listeners
 */
function beginSoduku(){

    $("html, body, .Cell").css("cursor", "progress");

    $("#begin-button").css("grid-area", "");
    
    $("#begin-button").css("display", "none");

    $("#spinner").css("display", "block");

    $("#spinner").css("grid-area", "Begin");

    setTimeout(() => {

        startTime = Date.now(); // For timing generation
    
        livesEnabled = $("#invalid-answer").is(":checked") && 
            !$("#invalid-answer").prop("disabled");

        if (livesEnabled){

            puzzle["lives"] = 5;

        }
    
        highlightingEnabled = $("#number-highlight").is(":checked");

        allowMultipleSolutions = !$("#force-unique").is(":checked") && 
            !$("#force-unique").prop("disabled");

        [grid, solutions] = generateSoduku(parseInt($("#difficulty").val()));

        puzzle["grid"] = grid;

        puzzle["solutions"] = solutions;
    
        $("#begin-panel").css("display", "none");
    
        $("html, body, .Cell").css("cursor", "default");

        console.log(
            `Generation took -> ${getTimeTaken()}`
        );

        $(".soduku-block div").each(function(){

            $(this).addClass("soduku-cell")

            $(this).on("click", onCellClick);

        });

        $(window).on("keydown", onKeydown);

        startTime = Date.now();

    }, 100); // Used to ensure the cursor updates to the spinner

}

/**
 * Calculate the time in minutes and seconds between a given date object and now
 * @returns {string} A string containing the minutes and seconds passed
 */
function getTimeTaken(){

    let seconds = Math.floor(
        (Date.now() - startTime) / 1000
    );

    const minutes = Math.floor(seconds / 60);

    seconds = seconds - (minutes * 60);

    return `${minutes} minutes ${seconds} seconds`;

}

/**
 * Handles selected and deselecting of cells
 * @param {event} event The click event fired when a cell is clicked
 */
function onCellClick(event){

    if (highlightingEnabled){

        const previousId = focusedCellID;

        focusedCellID = this.id;

        clearHighlight();

        highlightAssociatedCells();

        focusedCellID = previousId;

    }
    
    if ($(this).attr("lockedCell") !== "true"){

        if (this.id === focusedCellID){
            
            clearSelectedCell();
    
            clearHighlight();
            
        }
        else{

            if (focusedCellID){
                
                clearSelectedCell();

            }

            $(this).addClass("selected-cell");

            $("#numberpad").css("display", "grid");

            focusedCellID = this.id;

        }

    }

    event.stopPropagation();

}

/**
 * Handles whether or not to pass the input to the numberpad
 * @param {event} event The KeyboardEvent that is fired when a key is pressed down
 */
function onKeydown(event){
    
    if (focusedCellID){

        const key = parseInt(event.key);

        if (!isNaN(key)){

            if (key > 0){

                numberpad(event, key);

            }

        }
        else{

            switch(event.keyCode){

                case 8:

                    $("#numberpad-clear").click();

                    break;
                
                case 13:

                    $("#numberpad-enter").click();

                    break;

            }

        }

    }

}

/**
 * Generate the Soduku grid as well as all possible solutions according to the users setup choices
 * @param {number} difficulty The value corresponding to the number of cells to be given as hints
 * @returns {*[]} Returns an array containing the generated grid and all solutions
 */
function generateSoduku(difficulty){
    
    let grid, solutions, result;

    do{

        grid = [];

        solutions = [];

        let template = [1,2,3,4,5,6,7,8,9].sort(
            () => Math.random() - 0.5
        );

        for (let block = 0 ; block < 3 ; block++){

            for (let row = 0 ; row < 3 ; row++){

                grid.push(template);
                
                if (row !== 3){

                    let lastBlock = template.slice(6, 9);

                    template = template.slice(0, 6);

                    lastBlock.reverse();

                    for (let cell = 0 ; cell < 3 ; cell++){

                        template.unshift(lastBlock[cell]);

                    }

                }

            }

            let lastCell = template[8];

            template = template.slice(0, 8);

            template.unshift(lastCell);

        }

        let coordinates = {};

        let xCoordinate, yCoordinate;

        for (let i = 0 ; i < difficulty ; i++){

            do{

                yCoordinate = Math.round(Math.random() * 8);

                if (!coordinates.hasOwnProperty(yCoordinate)){

                    coordinates[yCoordinate] = [];

                }

            } while (coordinates[yCoordinate].length === 9);

            do{

                xCoordinate = Math.round(Math.random() * 8);
                
            } while (coordinates[yCoordinate].indexOf(xCoordinate) !== -1);

            coordinates[yCoordinate].push(xCoordinate);

        }

        for (let y = 0 ; y < 9 ; y++){

            for (let x = 0 ; x < 9 ; x++){

                if (coordinates.hasOwnProperty(y)){

                    if (coordinates[y].indexOf(x) !== -1){

                        continue;

                    }

                }
                
                grid[y][x] = 0;

            }

        }
        
        result = solveGrid(
            JSON.parse(
                JSON.stringify(grid) // Clone the grid to ensure it is not modified
            ), solutions
        );
        
    } while(result === -1 || solutions.length === 0);

    for (let y = 0 ; y < 9 ; y++){

        for (let x = 0 ; x < 9 ; x++){
            
            if (grid[y][x] !== 0){

                $(`#Cell-${y}-${x}`).attr("enteredValue", grid[y][x]);
    
                $(`#Cell-${y}-${x}`).html(grid[y][x]);
    
                $(`#Cell-${y}-${x}`).attr("lockedCell", "true");

            }

        }

    }

    return [grid, solutions];

}

/**
 * Solves a given grid, writing the solutions to a given array
 * @param {number[][]} grid An array containing the grid to try and solve
 * @param {number[][][]} solutions An array containing the solved grids of all found solutions
 * @returns {number} A value of undefined, -1 or -2 is returned; -1 -> grid is invalid for the chosen setup, -2 -> no more solutions were found
 */
function solveGrid(grid, solutions){

    if (solutions.length > 1 && !allowMultipleSolutions){

        return -1;

    }

    for (let y = 0 ; y < 9 ; y++){

        for (let x = 0 ; x < 9 ; x++){

            if (grid[y][x] === 0){
            
                for (let currentNumber = 1 ; currentNumber < 10 ; currentNumber++){

                    if (
                        checkAxis(y, x, currentNumber, grid) && 
                        checkSquare(y, x, currentNumber, grid)
                    ){

                        grid[y][x] = currentNumber;

                        const result = solveGrid(grid, solutions);

                        if (result){
                            
                            return result;

                        }

                        grid[y][x] = 0;

                    }

                }
                
                return

            }

        }

    }
    
    if (!solutionPresent(grid, solutions)){

        solutions.push(
            JSON.parse(
                JSON.stringify(grid) // Clone the grid to ensure the solution is not modified
            )
        );

    }
    else{
        
        return -2;

    }

}

/**
 * Checks whether the passed grid is present in solutions
 * @param {number[][]} grid An array containing the grid to try and solve
 * @param {numberp[][][]} solutions An array containing the solved grids of all found solutions
 * @returns {boolean} Whether or not the given grid is present in solutions
 */
function solutionPresent(grid, solutions){
    
    for (let y = 0 ; y < grid.length ; y++){

        for (let x = 0 ; x < grid[0].length ; x++){

            if (grid[y][x] === 0){
                
                return true;

            }

        }

    }

    let match = true;

    for (let index = 0 ; index < solutions.length ; index++){

        for (let y = 0 ; y < solutions[index].length ; y++){
    
            for (let x = 0 ; x < solutions[index][0].length ; x++){
    
                if (solutions[index][y][x] !== grid[y][x]){
    
                    match = false;
    
                }
    
            }
    
        }

    }
    
    return match && solutions.length !== 0;

}

/**
 * Checks whether or not value is valid when placed in grid[rowIndex][columnIndex] following standard Soduku rules
 * @param {number} rowIndex The index of the row to test
 * @param {number} columnIndex The index of the column to test
 * @param {number} value The value that is being tested
 * @param {number[][]} grid An array containing the grid to try and solve
 * @returns {boolean} Whether or not the move is valid
 */
function checkAxis(rowIndex, columnIndex, value, grid){

    if (grid[rowIndex].indexOf(value) !== -1){

        return false;

    }

    for (let row = 0 ; row < 9 ; row++){

        if (grid[row][columnIndex] === value){

            return false;

        }

    }

    return true;

}

/**
 * Checks whether the given value is present within the respective block (3x3 group of cells)
 * @param {number} rowIndex The index of the row to test
 * @param {number} columnIndex The index of the column to test
 * @param {number} value The value that is being tested
 * @param {number[][]} grid An array containing the grid to try and solve
 * @returns {boolean} Whether or not the move is valid
 */
function checkSquare(rowIndex, columnIndex, value, grid){

    const squareStartRow = 3 * Math.floor(rowIndex / 3);
    
    const squareStartColumn = 3 * Math.floor(columnIndex / 3);
    
    for (let row = 0 ; row < 3 ; row++){

        for (let column = 0 ; column < 3 ; column++){

            if (grid[squareStartRow + row][squareStartColumn + column] === value){

                return false;

            }

        }

    }

    return true;

}

/**
 * Handles inputting of values into selected cells
 * @param {event} event The event fired either from a keypress or a click
 * @param {number} value The number to input into the cell, or -1 for clearing a cell or -2 for entering a value
 */
function numberpad(event, value){

    if (value > 0){

        $(`#${focusedCellID}`).attr("tempValue", value);

        $(`#${focusedCellID}`).html(value);

        if (highlightingEnabled){

            clearHighlight();

            highlightAssociatedCells();

        }

        event.stopPropagation();

    }
    else{

        switch(value){

            case -1:

                $(`#${focusedCellID}`).attr("tempValue", "-1");

                $(`#${focusedCellID}`).attr("enteredValue", "-1");

                $(`#${focusedCellID}`).html("");

                break;
            
            case -2:
                
                if ($(`#${focusedCellID}`).attr("tempValue") !== "-1"){
                
                    $(`#${focusedCellID}`).attr(
                        "enteredValue", 
                        $(`#${focusedCellID}`).attr("tempValue")
                    );

                    $(`#${focusedCellID}`).html(
                        $(`#${focusedCellID}`).attr("tempValue")
                    );
                
                    $(`#${focusedCellID}`).attr("tempValue", "-1");

                    $(`#${focusedCellID}`).removeClass("incorrect");

                    if (livesEnabled){

                        checkAnswerValidity();

                    }

                    checkCompletion();
                
                }
                
                break;

        }

    }

}

/**
 * Highlights all cells with the same entered value as the selected cell
 */
function highlightAssociatedCells(){

    const clicked = $(`#${focusedCellID}`);

    const cellValue = clicked.html();

    const locked = clicked.attr("LockedCell") === "true";

    $(`div[enteredValue="${cellValue}"]`).each(function(){

        if (this.id !== focusedCellID || locked){

            $(this).addClass("highlighted");

        }

    });

}

/**
 * Removes the highlight from all cells
 */
function clearHighlight(){

    $(".highlighted").each(function(){

        $(this).removeClass("highlighted");

    });

}

/**
 * Clears the currently selected cell, as well as it's highlight and ID reference
 */
function clearSelectedCell(){

    if (
        $(`#${focusedCellID}`).attr("enteredValue") !== "-1" && 
        $(`#${focusedCellID}`).attr("enteredValue")
    ){

        $(`#${focusedCellID}`).html(
            $(`#${focusedCellID}`).attr("enteredValue")
        );

    }
    else{
        
        $(`#${focusedCellID}`).html("");

    }

    $(`#${focusedCellID}`).attr("tempValue", "-1");

    $(`#${focusedCellID}`).removeClass("selected-cell");

    $("#numberpad").css("display", "none");

    focusedCellID = null;

}

/**
 * Checks whether the Soduku grid is filled, and if so, is the grid correct
 */
function checkCompletion(){

    const grid = [];

    for (let y = 0 ; y < 9 ; y++){

        grid.push([]);

        for (let x = 0 ; x < 9 ; x++){

            if ($(`#Cell-${y}-${x}`).attr("enteredValue") === "-1"){
                
                return false;

            }
            else{

                grid[y].push(parseInt($(`#Cell-${y}-${x}`).attr("enteredValue")));

            }

        }

    }

    if (solutionPresent(grid, puzzle["solutions"])){

        displayEndScreen(true);

    }

}

/**
 * If lives were enabled on setup, this checks whether the inputted answer is correct
 */
function checkAnswerValidity(){

    const cellIndex = focusedCellID.split("Cell-")[1].split("-");
    
    cellIndex.map(
        (value, index, arr) => arr[index] = parseInt(value)
    );

    const enteredAnswer = parseInt(
        $(`#${focusedCellID}`).attr("enteredValue")
    );

    let validAnswer = false;

    for (let solution = 0 ; solution < puzzle["solutions"].length ; solution++){

        if (
            puzzle["solutions"][solution][cellIndex[0]][cellIndex[1]] === enteredAnswer
        ){

            validAnswer = true;

        }

    }
    
    if (!validAnswer){
        
        puzzle["lives"]--;

        if (puzzle["lives"] <= 0){

            displayEndScreen(false);

        }

        $(`#${focusedCellID}`).addClass("incorrect");

    }

}

/**
 * Disable all event listeners and hover events on the soduku grid
 */
function disabledGrid(){

    $(".soduku-block div").each(function(){

        $(this).removeClass("soduku-cell")

        $(this).unbind("click");

    });

    clearHighlight();
    
    clearSelectedCell();

}

/**
 * Displays the end screen and formats it as necessary
 * @param {boolean} success Whether or not the user completed the soduku successfully
 */
function displayEndScreen(success){

    disabledGrid();

    $("#end-screen").css("display", "grid");

    $("#end-time").html(
        `Solving For: ${getTimeTaken()}`
    );

    if (livesEnabled && puzzle["lives"] !== 0){

        $("#end-lives").html(
            `Lives Remaining: ${puzzle["lives"]}`
        );

    }
    else{

        $("#end-lives").css("display", "none");

    }

    if (success){

        $("#end-heading").html(
            "Congratulations, you solved it!"
        );

    }
    else{

        $("#end-heading").html(
            "Sometimes things just don't go our way, but that doesn't mean we should give up!"
        );

    }

}

/**
 * Regenerates the grid and displays the stup panel again
 */
function reset(){

    $("#end-screen").css("display", "none");

    $("#begin-panel").css("display", "grid");

    $("#begin-button").css("grid-area", "Begin");
    
    $("#begin-button").css("display", "block");

    $("#spinner").css("display", "none");

    $("#spinner").css("grid-area", "");

    generateGrid();

}