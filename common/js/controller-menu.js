/**
 * Created by troywilkes on 12/7/14.
 */
// controller-menu.js
angular.module('menuApp', []).controller('MenuController', function($scope) {
    $scope.menu = menuData;
    $scope.currentItem = null;

    $scope.initMenu = function() {
        const iframe = document.getElementById('content');
        if (iframe && iframe.src) {
            const page = iframe.src.split('/').pop();
            const matched = $scope.menu.find(item => item.page === page);
            if (matched) {
                $scope.setMenuItem(matched);
            }
        }
    };

    $scope.setMenuItem = function(item) {
        $scope.currentItem = item.name;

        // Remove active class from all menu items
        setTimeout(function () {
            const menuLinks = document.querySelectorAll('#menu a');
            menuLinks.forEach(link => link.classList.remove('active'));

            // Add active class to the current item
            const activeLink = document.getElementById(item.name);
            if (activeLink) {
                activeLink.classList.add('active');
            }
        }, 100);
    };
});