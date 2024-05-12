function getBrowserType() {
	var s = "AppName: " + navigator.appName;
	s = s + "\nAppCodeName: " + navigator.appCodeName;
	s = s + "\nAppVersion: " + navigator.appVersion;
	s = s + "\nuserAgent: " + navigator.userAgent;
	alert(s);
}
function strSearch(sub, str) {
	return str.indexOf(sub, 0) + 1
}
function isWin95() {
	if (strSearch("Windows 95", navigator.appVersion) || strSearch("Win95", navigator.appVersion))
		return true;
	else
		return false;
}
function isWinNT() {
	if (strSearch("Windows NT", navigator.appVersion) || strSearch("WinNT", navigator.appVersion))
		return true;
	else
		return false;
}
function screenOK() {
	if ((screen.width > 1023) && (screen.height > 767))
		return true
	else
		return false
}
function isIEDOM() {
	if (document.all)
		return true;
	else
		return false;
}
function isIE() {
	if (strSearch("Microsoft Internet Explorer", navigator.appName))
		return true;
	else
		return false;
}
function isIE40() {
	if (strSearch("MSIE 4.", navigator.userAgent))
		return true;
	else
		return false;
}
function isIE50() {
	if (strSearch("MSIE 5.", navigator.userAgent))
		return true;
	else
		return false;
}
function isIE60() {
	if (strSearch("MSIE 6.", navigator.userAgent))
		return true;
	else
		return false;
}
function isNetscape() {
	if (strSearch("Netscape", navigator.appName))
		return true;
	else
		return false;
}
function isNS70() {
	if (strSearch("Netscape/7.", navigator.userAgent))
		return true;
	else
		return false;
}