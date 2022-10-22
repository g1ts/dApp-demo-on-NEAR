import { get_value, set_value } from '../index';
import { context, storage } from 'near-sdk-as';

describe("tic-tac-toe ", () => {
    it("should set and get value", () => {
        set_value(10)
        expect(get_value()).toBe(10, "value mismatch");
    });
});