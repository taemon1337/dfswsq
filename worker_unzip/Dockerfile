FROM node

RUN npm install wsq
RUN npm install yauzl temp

COPY ./ /work
WORKDIR /work

CMD node run.js
