/**
 * Definition for a binary tree node.
 * function TreeNode(val) {
 *     this.val = val;
 *     this.left = this.right = null;
 * }
 */
/**
 * @param {TreeNode} root
 * @return {number[]}
 */
var postorderTraversal = function(root) {
  let result = [];
  let stack = deepleft(root);
  while (stack.length > 0) {
    let curNode = stack.pop();
    if (curNode.right !== null && !curNode.hasTraversal) {
      stack.push(curNode);
      stack = stack.concat(deepleft(curNode.right));
      curNode.hasTraversal = true
    } else {
      result.push(curNode.val);
    }
  }
  console.log(result);
  return result;
};

function deepleft(root) {
  let stack = [];
  while (root !== null) {
    stack.push(root);
    root = root.left;
  }
  return stack;
}

function TreeNode(val) {
  this.val = val;
  this.left = this.right = null;
}
var a = new TreeNode(1);
var b = new TreeNode(2);
var c = new TreeNode(3);

a.right = b;
b.right = c;

postorderTraversal(a);