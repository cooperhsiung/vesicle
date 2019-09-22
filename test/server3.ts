import { Action, Factory, Module, Service } from '../src/decorator';

@Service()
class Book {
  @Action()
  hi() {
    console.log('hello');
  }

  @Action()
  hi2() {
    throw new Error('asdad');
  }

  @Action()
  hello() {
    return 'hello';
  }
}

@Module([Book])
class AppModule {}

function bootstrap() {
  const app = Factory.create(AppModule);
  app.listen(6960);
  // console.log(app.actionMap);
}

bootstrap();
