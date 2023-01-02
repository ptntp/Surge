#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @Author   : chiupam
# @Time     : 2022/12/31 14:58
# @File     : Tenda.py
# @Project  : PycharmProjects

import requests


def main():
    # url = "http://10.0.0.2/login/Auth"
    # data = {"password": "QmVuOTk4MDMy"}
    # response = requests.post(url, data=data, allow_redirects=False)
    # response.encoding = "utf-8"
    # print(response.headers["Set-Cookie"])
    url = "http://10.0.0.2/goform/getStatus?modules=systemInfo"
    # headers = {"Cookie": response.headers["Set-Cookie"]}
    headers = {"Cookie": "ecos_pw=QmVuOTk4MDMy2dw:language=cn; path=/"}
    response = requests.get(url, headers=headers, allow_redirects=False)
    response.encoding = "utf-8"
    print(response.text)
    # print(response.json()['systemInfo']['statusWanIP'])


if __name__ == '__main__':
    main()
