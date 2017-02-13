FROM node

RUN npm install express archiver busboy node-uuid

COPY ./ /web
WORKDIR /web

CMD node run.js
