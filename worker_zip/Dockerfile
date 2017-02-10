FROM node

RUN npm install wsq
RUN npm install yazl

COPY ./ /work
WORKDIR /work

CMD node run.js
