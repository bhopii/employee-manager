const inquirer = require("inquirer");
const mysql = require("mysql");
const mainMenuQues = require("./questions");

// Define database connection here
const connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "password",
  database: "organization_db",
});

connection.connect(function (err) {
  if (err) throw err;
});

async function main() {
  const { userRes } = await inquirer.prompt(mainMenuQues);

  if (userRes === "Add Employee") {
    await addEmployee();
  } else if (userRes === "View All Employees") {
    let result = await viewAllEmployees();
    console.table(result);
    await main();
  } else if (userRes === "View All Employees By Department") {
    let result = await viewAllEmpByDept();
    console.table(result);
    await main();
  } else {
    connection.end();
  }
}

async function viewAllEmpByDept() {
  // get list of all departments and show choices to user using inquirer
  let availableDepartments = await fetchAllAvailableDepartments();
  //User selects a department
  let { deptAnswer } = await inquirer.prompt([
    {
      type: "list",
      choices: availableDepartments.map((dept) => dept.dept_name),
      name: "deptAnswer",
      message: "Choose Department",
    },
  ]);
  //once user selects a dept, query the database and find all employees in that dept
  let queryString = `select employee.first_name, employee.last_name,role.role_title,role.salary from employee 
    join role on employee.role_id = role.id 
    join department on department.dept_id = role.dept_id 
    where department.dept_name = '${deptAnswer}'`;

  return await executeQuery(queryString);
}

async function addEmployee() {
  //Get all the departments
  let availableDepartments = await fetchAllAvailableDepartments();
  //User selects a department
  let { deptAnswer } = await inquirer.prompt([
    {
      type: "list",
      choices: availableDepartments.map((dept) => dept.dept_name),
      name: "deptAnswer",
      message: "Choose Department",
    },
  ]);
  //Get all available roles as per the department
  let availableRoles = await fetchAllAvailableRoles(deptAnswer);

  //User selects a role
  let { roleAnswer, firstName, lastName } = await inquirer.prompt([
    {
      type: "list",
      choices: availableRoles.map((role) => role.role_title + "-" + role.id),
      name: "roleAnswer",
      message: "Choose Role",
    },
    {
      type: "input",
      message: "First Name?",
      name: "firstName",
    },
    {
      type: "input",
      message: "Last Name?",
      name: "lastName",
    },
  ]);

  //Insert into database
  let insertQuery = `insert into employee(first_name, last_name, role_id) values('${firstName}','${lastName}','${
    roleAnswer.split("-")[1]
  }')`;

  let result = await executeQuery(insertQuery);
  console.log(result.affectedRows + " record(s) updated");

  //Show main menu
  await main();
}

async function fetchAllAvailableDepartments() {
  let queryString = "select * from department";
  return await executeQuery(queryString);
}

async function fetchAllAvailableRoles(departmentName) {
  let queryString = `select role.id, role.role_title from role join department on role.dept_id = department.dept_id where dept_name='${departmentName}'`;
  return await executeQuery(queryString);
}

async function executeQuery(queryString) {
  return new Promise((resolve, reject) => {
    connection.query(queryString, function (err, res) {
      if (err) throw err;
      resolve(res);
    });
  });
}

main();

async function viewAllEmployees() {
  // call database to get the values
  var queryString =
    "select employee.id,employee.first_name, employee.last_name, role.role_title, " +
    "department.dept_name, role.salary, " +
    "concat (MgrDetails.first_name, ' ', MgrDetails.last_name) manager_name " +
    "from employee inner join role on employee.role_id = role.id join department " +
    "on department.dept_id = role.dept_id left join employee MgrDetails on employee.manager_id = MgrDetails.id";
  return await executeQuery(queryString);
}

// function viewAllEmpByManager() {
//   // call database to get the values
//   // display the result in table format
//   // go back to main menu
// }

// function removeEmployee() {
//   // call database to get the values of he current list of employees
//   // remove from database
// }

// function updateEmpRole() {
//   //display the employee list and ask which employee role you want to change
//   // show the list of roles and which role you want to change
//   // update the database
// }

// function updateEmployeeManager() {
//   //ask which employee's manager you want to changes
//   // display list of manager available
//   // update the change to database
// }

// function viewAllRoles() {
//   // call database to get the values
//   // display the result in table format
//   // go back to main menu
// }
