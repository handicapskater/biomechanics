// controller-menu.js
angular.module('menuApp', []).controller('MenuController', function($scope) {
    $scope.menu = menuData;
    $scope.currentItem = null;

    $scope.initMenu = function() {
        const hash = window.location.hash.substring(1);
        const matched = $scope.menu.find(item => item.name === hash);
        if (matched) {
            $scope.setMenuItem(matched);
        } else {
            // Default to first menu item
            $scope.setMenuItem($scope.menu[0]);
        }
    };

    $scope.setMenuItem = function(item) {
        $scope.currentItem = item.name;

        fetch(item.page)
            .then(response => {
                if (!response.ok) throw new Error(`Failed to load ${item.page}`);
                return response.text();
            })
            .then(html => {
                const contentDiv = document.getElementById("content");
                contentDiv.innerHTML = html;

                // Re-run all inline scripts
                const scripts = contentDiv.querySelectorAll("script");
                scripts.forEach(script => {
                    const newScript = document.createElement("script");
                    if (script.src) {
                        newScript.src = script.src;
                    } else {
                        newScript.textContent = script.textContent;
                    }
                    document.body.appendChild(newScript);
                });

                // Update hash and scroll
                window.location.hash = item.name;
                window.scrollTo(0, 0);
            })
            .catch(err => {
                document.getElementById("content").innerHTML = `<p>Error loading page: ${err.message}</p>`;
            });

        // Update menu UI
        setTimeout(() => {
            const menuLinks = document.querySelectorAll('#menu a');
            menuLinks.forEach(link => {
                link.classList.remove('active');
                link.removeAttribute('data-current');
            });

            const activeLink = document.getElementById(item.name);
            if (activeLink) {
                activeLink.classList.add('active');
                activeLink.setAttribute('data-current', 'true');
                activeLink.blur();
            }
        }, 100);
    };
});

// Handle hash navigation on initial load and back/forward navigation
window.addEventListener("load", function () {
    const scope = angular.element(document.querySelector('[ng-controller="MenuController"]')).scope();
    scope.initMenu();
    scope.$apply();
});

window.addEventListener("hashchange", function () {
    const scope = angular.element(document.querySelector('[ng-controller="MenuController"]')).scope();
    const hash = window.location.hash.substring(1);
    const matched = scope.menu.find(item => item.name === hash);
    if (matched) {
        scope.setMenuItem(matched);
        scope.$apply();
    }
});