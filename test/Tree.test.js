import {TestTree} from "../utils/Tree";

const treeData = {
  id: 0,
  name: '0',
  children: [
    {
      id: 1,
      name: '0-1'
    },
    {
      id: 2,
      name: '0-2',
      children: [
        {
          id: 21,
          name: '0-2-1'
        },
        {
          id: 22,
          name: '0-2-2'
        },
      ]
    },
    {
      id: 3,
      name: '0-3'
    },
    {
      id: 4,
      name: '0-4'
    },
  ]
}
test('testTree: iterator', () => {
  const tree = new TestTree(treeData)
  let name = ''
  tree.iterator(item => {
    name += item.name + ', '
  })
  console.log(name)
  expect(tree.getItem(3).name).toEqual('0-3')
  expect(tree.getItem(21).name).toEqual('0-2-1')
  expect(tree.getItemPath(1).map(item => item.id)).toEqual([0, 1])
  expect(tree.getItemPath(22).map(item => item.id)).toEqual([0, 2, 22])
  expect(tree.deleteByItem({id: 21})).toEqual(true)
  expect(tree.deleteByUniqueId(1)).toEqual(true)
  expect(tree.insertItem(2, 0, {id: 23, name: '0-2-3'})).toEqual(true)
  console.log(tree.getItemPath(23))
})