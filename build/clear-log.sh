#!/bin/bash

# dirname $0，取得当前执行的脚本文件的父目录
currentPath=$(cd `dirname $0`; pwd)

# 当前执行环境目录
cd $currentPath
cd ..
base=$(pwd)
echo 脚本执行目录: $base

for log in $(ls ./assets)
do
  if [ -f $base/assets/$log ] && [ $(echo $log | awk -F '.' '{ print $2 }') == 'txt' ]; then
    rm ./assets/$log
    echo 删除 $log
  fi
done