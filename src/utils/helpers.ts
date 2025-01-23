// 验证工具输出的辅助函数
function isValidJSON(str: string): boolean {
	try {
		JSON.parse(str);
		return true;
	} catch (e) {
		return false;
	}
}
export { isValidJSON };
