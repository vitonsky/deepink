This document explain key principles in software design.

# Data storage

Data keeps in relational database. We use SQLite as embedded SQL DB.

We have full control over data loading from disk into DB and over sync data from DB to disk, thus we can handle DB file to compress and encrypt data.

A big files must never be saved into SQL DB, instead it must be encrypted and saved to special sub directory in data directory.