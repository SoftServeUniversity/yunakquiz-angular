 **<h3>Front-end part of the YunakQuiz project</h3>** <br /> 
yunakquiz-angular configured to deploy to Heroku <br /> 


1. Clone this repository <br/> 
**git clone https://github.com/SoftServeUniversity/yunakquiz-angular.git** </br>
 


1. navigate to root folder **(./yunakquiz-angular)**<br />
2. in terminal **"heroku create"** (assuming heroku toolbelt instaled and logged in)<br />
3. type : **"git push heroku master"**<br />

**issues:** app using http protocol , need to recongigure to https ( heroku uses https and block http)