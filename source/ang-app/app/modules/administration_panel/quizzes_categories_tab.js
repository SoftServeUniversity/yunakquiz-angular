(function (){
  var  app = angular.module('yunakQuiz.quizzescategoriesTab' ,['ngRoute','yunakQuiz.categoriesContainer','yunakQuiz.permission']);

    app.config(['$routeProvider',
      function($routeProvider) {
        $routeProvider.
          when('/administration-panel/quizzescategoriesTab', {
            templateUrl: './modules/administration_panel/quizzes_categories_tab.html',
            controller: 'quizzescategoriesTab'
          })
      }
    ]);
    app.factory("categoryEdit", ['$http', function ($http) {
      return { 
        create : function(data) {
          return $http.put('http://localhost:9292/admin/category/create', data)
        },
        update : function(data) {
          return $http.put('http://localhost:9292/admin/category/update', data)
        },
        delCat : function(data) {
          return $http.delete('http://localhost:9292/admin/category/delete/' + data)
        }
      }
    }]);
    app.factory("addParCatTitle", function(){
      return function(target){
        var catsById = {};
        var catsAsArray = [];

        angular.forEach(target, function(cat, key){
         catsById[cat.id] = cat;
        });
        angular.forEach(catsById, function(cat, key){
          if(cat.category_id!=0){
            if(!catsById[cat.category_id]) {
             catsById[cat.category_id] = {};
             catsById[cat.category_id].title = "error in DB";
            } else {
            cat.parCatTitle = catsById[cat.category_id].title;
            catsAsArray.push(cat);
            }
          } else {
            cat.parCatTitle = '---';
            catsAsArray.push(cat);
          }
      });
      return catsAsArray;
      }
    });

    app.factory("captchaRnd", function(){
      return function (){
        var min = 1000;
        var max = 9999;
        var rnd = 0;

        rnd = Math.round(Math.random() * (max - min) + min);
        return rnd;
      };
    });

    app.factory("doCatHaveSubCat", function(){
      return function (category, categoriesList, subCategoriesList){
        var result = false;
          angular.forEach(categoriesList, function(cat, key){
            if(cat.category_id != 0 && cat.category_id == category.id){
              subCategoriesList.push(cat);
              result = true;
            };
          });
        return {haveCats: result, subCatsList:subCategoriesList} ;
      }
    });

    app.factory("getParCats", function(){
      return function (target){
        var parCats = [];

          angular.forEach(target, function(cat, key){
            if(cat.category_id === 0){
              parCats.push(cat);
            };
          });
        return parCats;
      }
    });

    app.factory("getSubCats", function(){
      return function (target){
        var subCats = [];

          angular.forEach(target, function(cat, key){
            if(cat.category_id != 0){
              subCats.push(cat);
            };
          });
        return subCats;
      };
    });    

    app.controller('quizzescategoriesTab', 
      ['$http', '$scope','categoriesQuery', 'categoryEdit', 'quizCount', 'addParCatTitle',
       'captchaRnd', 'doCatHaveSubCat','getSubCats','getParCats','getTabTemplates', '$location','getAccess','$modal',
       function ($http, $scope, categoriesQuery, categoryEdit, quizCount, addParCatTitle,
        captchaRnd, doCatHaveSubCat, getSubCats, getParCats, $location,$modal, getAccess){
      $scope.tab = 'Категорії тестів';
      $scope.allCategories = {};
      $scope.currentCategory = {};
      $scope.currentCatToEdit = {};
      $scope.catToDelete = {};
      $scope.catToEdit = {};
      $scope.subParCatSelect = {};
      $scope.parCatGrouped = {};
      $scope.subCategories = [];
      $scope.captchaInput = '';
      $scope.captchaText = '';
      $scope.errorModalMsg = '';
      $scope.catExistErr = 'Така категорія вже існує';
      $scope.catEditServerErr = 'Помилка при редагуванні';
      $scope.catHaveSubCatMsg = 'Увага, категорія містить підкатегорії';
      $scope.catDeleteServerErr = 'Помилка при видаленні';
      $scope.catDelRelationalDataMsg = 'Увага, будуть видалені підкатегорії та інші пов\'язані дані';
      
      getAccess($scope.tab).then(function(data){
        if(data) {
        updateCatPage();
        } else {
          $location.path( "/404" );
        }
      },function(){
        $location.path( "/404" ); 
        }
      );

      $scope.createCategory = function(){
        var request = {id:$scope.subParCatSelect.id, title:$scope.currentCategory.title};
        
        if(captchaValidate()){
          categoryEdit.create(request).success(function(data){
            $("#createCatModal").modal("hide");
            updateCatPage();
          })
          .error(function(data){
            $scope.errorModalMsg = $scope.catExistErr;
          });
        };
      };

      $scope.updateCategory = function(){
        var request = 
        {id: $scope.currentCatToEdit.id,
         category_id: $scope.subParCatSelect.id,
         title: $scope.catToEdit.title};

        if(captchaValidate()){ 
          categoryEdit.update(request).success(function(data){
            $("#editCatModal").modal("hide");
            updateCatPage();
          }).error(function(data){
            $scope.errorModalMsg = $scope.catEditServerErr;
          });
        };
      };

      $scope.deleteCategory = function(){
        var request = $scope.catToDelete.id;
        
        if(captchaValidate()){ 
          categoryEdit.delCat(request).success(function(data){
            $("#deleteCatModal").modal("hide");
            updateCatPage();
          }).error(function(data){
            $scope.errorModalMsg = $scope.catDeleteServerErr;
          });
        };
      };

      $scope.showCreateCatDlg = function(){
        $scope.clearForm();
        $scope.captchaText = captchaRnd();
        $("#createCatModal").modal("show");
      };
      
      $scope.showDeleteCatDlg = function(category){
        $scope.clearForm();
        $scope.captchaText = captchaRnd();
        jQuery.extend($scope.catToDelete,category);
        setCurCatEditDlg(category);
        showHideAlertMsgButtons(category, $scope.catDelRelationalDataMsg, false);
        $("#deleteCatModal").modal("show");
      };
      
      $scope.showEditCatDlg = function(category){
        $scope.clearForm();
        $scope.captchaText = captchaRnd();
        jQuery.extend($scope.currentCatToEdit,category);
        jQuery.extend($scope.catToEdit,category); //we do not need two way data binding here
        setCurCatEditDlg(category);
        showHideAlertMsgButtons(category, $scope.catHaveSubCatMsg, true);
        $("#editCatModal").modal("show");
      };

      function setCurCatEditDlg(category){
        angular.forEach($scope.parCatGrouped, function(cat, key){
          if(cat.id === category.category_id) {
            $scope.subParCatSelect = $scope.parCatGrouped[key];
          }
        })
      };

      $scope.clearForm = function(){
        $scope.subParCatSelect = $scope.parCatGrouped[$scope.parCatGrouped.length-1];
        $scope.categoryAddition.$setPristine();
        $scope.editCat.$setPristine();
        $scope.currentCategory = {};
        $scope.currentCatToEdit = {};
        $scope.subCategories = [];
        $scope.captchaInput = '';
        $scope.captchaRnd = '';
        $("#selSubCatEdit").prop('disabled', false);
        $scope.errorModalMsg = '';
        $(".captcha").removeClass("invalid");
      };
      
      function updateCatPage(){
        categoriesQuery.getAllCategories().success(function(data){
          var subCats;

          $scope.parCatGrouped = getParCats(data);
          subCats = getSubCats(data);
          $scope.subParCatSelect = addDefaultOption($scope.parCatGrouped, $scope.subParCatSelect);
          $scope.allCategories = addParCatTitle(data);
          $scope.groupedQuizzes = quizCount(subCats);
          $scope.clearForm();
        });
      };

      function showHideAlertMsgButtons(category, alertMsg, parCatSelLock) {
        var result = doCatHaveSubCat(category, $scope.allCategories, $scope.subCategories)
        if(result.haveCats){
           $scope.subCategories = result.subCatsList;
          //show hidden button and alert message,lock select parCat;
          $scope.errorModalMsg = alertMsg;
          $(".dropdownSubCats").show();
          if(parCatSelLock) {
            $("#selSubCatEdit").prop('disabled', true);
          };
        } else {
          //hidde button and alert message;
          $scope.errorModalMsg = '';
          $(".dropdownSubCats").hide();
        };
      };

      function addDefaultOption(target, optionByBindName){
        var defaultToCreate = {id:0, category_id:0, title:"---"};
          
          target.push(defaultToCreate);
          optionByBindName = target[target.length-1];
          return optionByBindName;
      };

      function captchaValidate(){
        if(parseInt($scope.captchaInput) === $scope.captchaText) {
          return true;
        } else {
          $scope.captchaText = captchaRnd();
          $scope.captchaInput ='';
          $('.captcha').addClass("invalid");
          return false;
        };
      }
    }]);
})();