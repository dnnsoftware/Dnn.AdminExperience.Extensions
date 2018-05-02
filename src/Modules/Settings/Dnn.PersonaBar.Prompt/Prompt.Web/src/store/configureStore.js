import { createStore, applyMiddleware, compose } from "redux";
import thunkMiddleware from "redux-thunk";
import reduxImmutableStateInvariant from "redux-immutable-state-invariant";
import reducers from "../reducers/promptReducers";
import DevTools from "../containers/DevTools";
import { IS_DEV} from "../globals/promptInit";

/* eslint-disable no-undef */
const IS_PRODUCTION = process.env.NODE_ENV === "production";

export default function configureStore(initialState) {
    const store = createStore(
        rootReducer,
        initialState,
        compose(
            IS_PRODUCTION ?
                applyMiddleware(thunkMiddleware) :
                applyMiddleware(thunkMiddleware, reduxImmutableStateInvariant()), DevTools.instrument()
        )
    );
    return store;
}