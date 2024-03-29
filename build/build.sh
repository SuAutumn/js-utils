#!/bin/bash

# dirname $0，取得当前执行的脚本文件的父目录
currentPath=$(cd `dirname $0`; pwd)

# 当前执行环境目录
cd $currentPath
cd ..
base=$(pwd)
echo 脚本执行目录: $base
# mkdir dist
if [ ! -d $base/dist ];then
  mkdir dist
fi
if [ ! -d $base/dist/mjs ];then
  mkdir dist/mjs
else
  rm -rf dist/mjs/*
fi

for filename in $(ls ./utils)
do
  # $(xxx）表示执行xxx命令后的结果
  name=$(echo $filename | awk -F '.' '{ print $1 }')
  ext=$(echo $filename | awk -F '.' '{ print $2 }')
  if [ $ext == "js" ]; then
    cp utils/$filename dist/mjs/$name.mjs
  else
    echo $filename is not copy to ./dist/mjs/
  fi
  # echo "name: $filename ${#filename}"
  # cp utils/$filename dist/mjs/$filename.mjs
done
