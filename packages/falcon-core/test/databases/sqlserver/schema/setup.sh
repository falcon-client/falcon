#!/bin/bash

sqlcmd -S localhost,1433 -U sa -P password -Q "CREATE DATABASE sqlectron" -d "master"
sqlcmd -S localhost,1433 -U sa -P password -i /schema/schema.sql -d "sqlectron"
sqlcmd -S localhost,1433 -U sa -P password -Q "select table_name from information_schema.tables" -d "sqlectron"
