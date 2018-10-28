//------------------------------------------------------------------------------------------------------------//
//                                         //== BUDGET CONTROLLER ==//                                        //
//------------------------------------------------------------------------------------------------------------//
//         This module is responsible for handling and manipulating the data in the application               //            
//------------------------------------------------------------------------------------------------------------//
var budgetController = (function() {
    
    //=========PRIVATE VARIABLES, OBJECTS, AND FUNCTIONS========//
    
    //Objects & Object Prototypes
    var Expense = function(id, desc, value){
        this.id = id;
        this.desc = desc;
        this.value = value;
        this.percentage = -1;
    };
    
    Expense.prototype.calculatePercentage = function(totalIncome){
        if(totalIncome > 0){
            this.percentage = Math.round((this.value/totalIncome) * 100);
        }else {
            this.percentage = -1;
        }
    };
    
    Expense.prototype.getPercentage = function(){
        return this.percentage;
    };
    
    var Income = function(id, desc, value){
        this.id = id;
        this.desc = desc;
        this.value = value;
    };    
    
    
    //Core Data-Structure for Stroring In-App Data
    var data = {
        allItems: {
            expense: [], 
            income: []
        }, 
        
        totals: {
            expense: 0,
            income: 0
        }, 
        budget: 0, 
        percentage: -1
    };
    
    
    //Private method for calculating the total amount of income or expenses
    var calculateTotal = function(type){
        var sum = 0;
        data.allItems[type].forEach(function(current){
           sum += current.value;
        });
        
        data.totals[type] = sum;
    };
    
    //=========PUBLIC VARIABLES AND FUNCTIONS========//
    return{
        
        // Adds an item to the Data Structure //
        addItem: function(type, des, val){
            var newItem, ID;
            
            //Create new ID 
            if(data.allItems[type].length > 0){
                ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
            }else{
                ID = 0;
            }
            
            //Create a new item based on whether or not it is an expense or an income
            if(type === 'expense'){
                newItem = new Expense(ID, des, val);
            }
            else if(type === 'income'){
                newItem = new Income(ID, des, val);
            }
            
            //Add the item to the data structure
            data.allItems[type].push(newItem);
            
            //Return the new item
            return newItem;
        }, 
        
        // Deletes an item from the Data Structure //
        deleteItem: function(type, id){
            var ids, index
            
            ids =  data.allItems[type].map(function(current){
               return current.id; 
            });
                        
            index = ids.indexOf(id);
            
            if(index !== -1){
                data.allItems[type].splice(index, 1);
            }
        },
        
        // Calculates the budget
        calculateBudget: function(){
            // Calculate total income and expenses
            calculateTotal('income');
            calculateTotal('expense');
            
            // Calculate budget (income - expenses)
            data.budget = data.totals.income - data.totals.expense;
            
            // Calculate the percentage of income
            if(data.totals.income > 0){
                data.percentage = Math.round((data.totals.expense / data.totals.income) * 100);
            }else{
                data.percentage = -1;
            }
        }, 
        
        // Calculates the percentage of each expense in regards to total income
        calculatePercentages: function(){
            data.allItems.expense.forEach(function(current){
                current.calculatePercentage(data.totals.income);
            });
        }, 
        
        // Returns a complete map of percentages for each expense
        getPercentages: function(){
            var allPercentages = data.allItems.expense.map(function(current){
              return current.getPercentage(); 
            }); 
            
            return allPercentages;
        }, 
        
        // Returns all of the budget information
        getBudget: function(){
            return{
                budget: data.budget, 
                totalIncome: data.totals.income, 
                totalExpense: data.totals.expense,
                percentage: data.percentage
            }
        }
    };
})();









//------------------------------------------------------------------------------------------------------------//
//                                             //== UI CONTROLLER ==//                                        //
//------------------------------------------------------------------------------------------------------------//
//           This module is responsible for handling and making all of the changes within the UI              //            
//------------------------------------------------------------------------------------------------------------//
var UIController = (function(){
    
    //=========PRIVATE VARIABLES AND FUNCTIONS========//
    
    //DOM Strings to be used throughout the application//
    var DOMStrings = {
        inputType:  '.add__type', 
        inputDesc:  '.add__description', 
        inputValue: '.add__value', 
        inputBtn:   '.add__btn', 
        incomeContainer: '.income__list', 
        expenseContainer: '.expenses__list', 
        budgetLabel: '.budget__value',
        incomeLabel: '.budget__income--value', 
        expenseLabel: '.budget__expenses--value', 
        percentLabel: '.budget__expenses--percentage', 
        container: '.container', 
        expPercentageLabel: '.item__percentage', 
        dateLabel: '.budget__title--month'
    };
    
    //Formats a number as a currency, with a + or - for income/expense, commas, and a decimal for cents
    var formatNumber = function(number, type){
        var num, numSplit, int, dec, start

        num = Math.abs(number);
        num = num.toFixed(2);
        numSplit = num.split('.');

        int = numSplit[0];
        dec = numSplit[1];

        if(int.length > 3){
            start = int.length % 3 === 0 ? 3 : int.length % 3;

            while(start < int.length){
                int = int.substr(0, start) + ',' + int.substr(start);
                start += 4;
            } 
        }

        return (type === 'expense' ? '-' : '+') + ' $' + int + '.' + dec;
    };
    
    //Private method for calling a function for each item in a list
    var nodeListForEach = function(list, callback){
        for(var i = 0; i < list.length; i++){
            callback(list[i], i);
        }
    };
    
    //=========PUBLIC VARIABLES AND FUNCTIONS========//
    return{
        
        // Returns the values from the UI that the user input //
        getInput: function(){
            return {
                type: document.querySelector(DOMStrings.inputType).value,
                desc: document.querySelector(DOMStrings.inputDesc).value,
                value: parseFloat(document.querySelector(DOMStrings.inputValue).value)   
            };
        },
        
        // Adds an item to the list in the UI //
        addListItem: function(obj, type){
            var html, newHtml, element;
            
            
            //Create HTML string with placehjolder tags
            if(type === 'income'){
                element = DOMStrings.incomeContainer;
                
                html = '<div class="item clearfix" id="income-%id%"> <div class="item__description">%desc%</div> <div class="right clearfix"> <div class="item__value">%value%</div> <div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            }
            else if(type === 'expense'){                 
                element = DOMStrings.expenseContainer;
                
                html = '<div class="item clearfix" id="expense-%id%"><div class="item__description">%desc%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"> <button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div> </div></div>';
            }

            //Replace placeholder tags with actual data
            newHtml = html.replace('%id%', obj.id);
            newHtml = newHtml.replace('%desc%', obj.desc);
            newHtml = newHtml.replace('%value%', formatNumber(obj.value, type));
            
            //Insert HTML into DOM
            document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);
        }, 
        
        // Deletes an item from the list in the UI //
        deleteListItem: function(selectorId){
            var element = document.getElementById(selectorId);
            element.parentNode.removeChild(element);
        },
        
        
        // Clears the input fields and resets the focus back to the first inoput array //
        clearFields: function(){
            var fields, fieldsArr;
           
            fields = document.querySelectorAll(DOMStrings.inputDesc + ', ' + DOMStrings.inputValue);
            fieldsArr = Array.prototype.slice.call(fields);
            
            fieldsArr.forEach(function(current){
                current.value = '';
            });
            
            fieldsArr[0].focus();
        }, 
        
        // Displays the budget information in the UI //
        displayBudget: function(obj){
            var type
            
            type = obj.budget > 0 ? 'income' : 'expense';
            
            document.querySelector(DOMStrings.budgetLabel).textContent = formatNumber(obj.budget, type);
            document.querySelector(DOMStrings.incomeLabel).textContent = formatNumber(obj.totalIncome, 'income');
            document.querySelector(DOMStrings.expenseLabel).textContent = formatNumber(obj.totalExpense, 'expense');
            
            if(obj.percentage > 0){
                document.querySelector(DOMStrings.percentLabel).textContent = obj.percentage + '%';
            }else{
                document.querySelector(DOMStrings.percentLabel).textContent = '---';
            }
        },
        
        // Displays the percentage values in the 
        displayPercentages: function(percentages){
            var fields
            
            fields = document.querySelectorAll(DOMStrings.expPercentageLabel);
                        
            nodeListForEach(fields, function(current, index){
                if(percentages[index] > 0){
                    current.textContent = percentages[index] + '%';
                }
                else{
                    current.textContent = '---';
                }
            });
        }, 
        
        // Displays the month and year within the ui //
        displayMonth: function(){
            var now, year, month, months
            
            months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
           
            now = new Date();
            month = now.getMonth();
            year = now.getFullYear();
            month = now.getMonth();
            
            document.querySelector(DOMStrings.dateLabel).textContent = months[month] + ' ' + year;
        }, 
        
        // Changes the color of the input fields outline depending on whether or not expense or income is selected
        changedType: function(){
            var fields
            
            fields = document.querySelectorAll(
                DOMStrings.inputType + ',' +
                DOMStrings.inputDesc + ',' +
                DOMStrings.inputValue);
            
            nodeListForEach(fields, function(current){
                current.classList.toggle('red-focus');
            });
            
            document.querySelector(DOMStrings.inputBtn).classList.toggle('red');
        },
        
        // Return the DOM Strings to be used in other modules //
        getDOMStrings: function(){
            return DOMStrings;
        }
    }
    
})();










//------------------------------------------------------------------------------------------------------------//
//                                          //== MAIN CONTROLLER ==//                                         //
//------------------------------------------------------------------------------------------------------------//
//                      This central controller bridges togteher the UI and Data Modules                      //            
//------------------------------------------------------------------------------------------------------------//
var controller = (function(budgetCtrl, UICtrl){
    //=========PRIVATE VARIABLES AND FUNCTIONS========//
    
    // SETS UP THE EVENT LISTENERS THROUGHOUT THE APP //
    var setupEventListeners = function(){
        var DOM = UICtrl.getDOMStrings();
        
        //Handles when the add button is clicked or enter  is pressed
        document.querySelector(DOM.inputBtn).addEventListener('click', ctrlAddItem);
        document.addEventListener('keypress', function(event){
            if(event.charCode === 13 || event.which === 13){
                ctrlAddItem();
            }
        });
        
        //Handles when the delete button is clicked for an income or expense
        document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);
        
        //Handles when the '+' and '-' button is toggled
        document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changedType);
    };
    
    // UPDATES THE BUDGET //
    var updateBudget = function(){
        // Calculate the budget
        budgetCtrl.calculateBudget();
        
        // Return the budget
        var budget = budgetCtrl.getBudget();
        
        // Display the budget in the UI
        UICtrl.displayBudget(budget);
    };
    
    // UPDATES THE PERCENTAGES
    var updatePercentages = function(){
        // Calculate percentages
        budgetCtrl.calculatePercentages();
        
        // Read percentages from budget controller
        var percentages = budgetCtrl.getPercentages();
        
        // Update the UI
        UICtrl.displayPercentages(percentages);
    };
    
    
    // ADDS AN ITEM TO THE BUDGET //
    var ctrlAddItem = function(){
        var input, newItem;
        
        //Get input data from the UI
        input = UICtrl.getInput();
        
        if(input.desc !== '' && !isNaN(input.value) && input.value > 0){
            //Add the item to the budget controller
            newItem = budgetCtrl.addItem(input.type, input.desc, input.value);

            //Add the item to  the UI
            UICtrl.addListItem(newItem, input.type);

            //Clear the fields
            UICtrl.clearFields();

            //Calculate and update budget
            updateBudget();
            
            // Calculate and update percentages
            updatePercentages();
        }
    };
    
    
    // DELETES AN ITME FROM THE BUDGET //
    var ctrlDeleteItem = function(event){
        var itemId, splitId, type, id
        
        itemId = event.target.parentNode.parentNode.parentNode.parentNode.id;
        
        if(itemId){
            splitId = itemId.split('-');
            type = splitId[0];
            id = parseInt(splitId[1]);
            
            // Delete Item from Data Structure
            budgetCtrl.deleteItem(type, id);
            
            // Delete item from UI
            UICtrl.deleteListItem(itemId);
            
            // Recalculate the budget
            updateBudget();
            
            // Calculate and update percentages
            updatePercentages();
        }
    }
    
    
    //=========PUBLIC VARIABLES AND FUNCTIONS========//
    return{  
        // SETS UP THE APPLICATION UPON STARTUP
        init: function(){
            UICtrl.displayBudget({
                budget: 0, 
                totalIncome: 0, 
                totalExpense: 0, 
                percentage: 0
            });
            
            UICtrl.displayMonth();
            setupEventListeners();   
        }
    }
})(budgetController, UIController);


//== START THE APPLICATION ==//
controller.init();