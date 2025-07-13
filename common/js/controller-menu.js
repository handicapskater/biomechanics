
function loadDynamicContent(id) {
    if (window[id]) {
        const el = document.getElementById(id);
        if (el) {
            if (typeof window[id] === 'function') {
                const result = window[id]();
                if (typeof result === 'string') {
                    el.innerHTML = result;
                } else {
                    console.warn(`Function ${id} did not return a string.`);
                }
            } else {
                console.warn(`${id} exists but is not a function.`);
            }
        } else {
            console.warn(`Element with id '${id}' not found.`);
        }
    } else {
        console.warn(`Function '${id}' not found on window.`);
    }
}

function injectTooltips() {
    const spanIds = Object.keys(window).filter(key => typeof window[key] === 'string' && window[key].includes('<span'));
    spanIds.forEach(id => {
        const span = document.getElementById(id);
        if (span) {
            span.outerHTML = window[id];
        }
    });
}

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
                const container = document.getElementById("content");
                container.innerHTML = html;

                // Re-run script tags
                const scripts = container.querySelectorAll("script");
                scripts.forEach(script => {
                    const newScript = document.createElement("script");
                    if (script.src) {
                        newScript.src = script.src;
                    } else {
                        newScript.textContent = script.textContent;
                    }
                    document.body.appendChild(newScript);
                });

                // ✅ Run tooltip replacement logic again
                container.querySelectorAll("span[id]").forEach(span => {
                    const id = span.id;
                    const fullSpan = window[id];
                    if (typeof fullSpan === "string" && fullSpan.includes("<span")) {
                        span.outerHTML = fullSpan;
                    }
                });

                window.location.hash = item.name;
                window.scrollTo(0, 0);
            })
            .catch(err => {
                document.getElementById("content").innerHTML = `<p>Error loading page: ${err.message}</p>`;
            });

        // Update active menu link
        setTimeout(function () {
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

$scope.loadPage = function(page) {
    const container = document.getElementById("content");
    fetch(page)
        .then(response => response.text())
        .then(html => {
            container.innerHTML = html;

            // 🔁 ADD THIS HERE: Re-run tooltip logic
            container.querySelectorAll("span[id]").forEach(span => {
                const id = span.id;
                const fullSpan = window[id];
                if (typeof fullSpan === "string" && fullSpan.includes("<span")) {
                    span.outerHTML = fullSpan;
                }
                injectTooltips();
            });
        });
};