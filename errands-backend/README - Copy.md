# errands-backend

pull <https://github.com/vistait2018/errands.git>
run cd to errands-backend
run npm install

create database in mysql namaed 'app_errands'
in the .env file set the DB_PASSWORD=to your database password i 

open your terminal if you are not in errands-backend
run cd to errands-backend

run node ace migration:run
run node ace db:seed
run npm run dev
goto the helpers/send_mail folder
change mailRecipient = your email
 Server address: <http://localhost:3333>

