/**
 * Created by troywilkes on 12/7/14.
 */
function MenuController($scope) {
    $scope.menu = menuData;
    $scope.setMenuItem = setItem;
}

var lastButton = { name: 'overview', page: 'overview.htm', text: 'Overview' };

function setItem(menuItem) {
    $('#'+lastButton.name).toggleClass('linkActionHi');
    $('#'+menuItem.name).toggleClass('linkActionHi');
    lastButton = menuItem;
}

window.onload = function () {
    var iframe = document.getElementById('mainFrame');
    iframe.style.height = window.innerHeight - 80 + 'px';
};

window.onresize = function () {
    var iframe = document.getElementById('mainFrame');
    iframe.style.height = window.innerHeight - 80 + 'px';
};